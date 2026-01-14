import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';

export interface IGraphUser {
  id: string;
  displayName: string;
  jobTitle?: string;
  department?: string;
  mail?: string;
  userPrincipalName?: string;
  photo?: string; // base64 data URL
}

export interface IOrgMember extends IGraphUser {
  parent?: string;
  initials?: string;
}

export class GraphService {
  private context: WebPartContext;
  private graphClient: MSGraphClientV3 | null = null;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  private async getClient(): Promise<MSGraphClientV3> {
    if (!this.graphClient) {
      this.graphClient = await this.context.msGraphClientFactory.getClient('3');
    }
    return this.graphClient;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  public async getUserByEmail(email: string): Promise<IGraphUser | null> {
    try {
      const client = await this.getClient();
      const user = await client
        .api(`/users/${email}`)
        .select('id,displayName,jobTitle,department,mail,userPrincipalName')
        .get();
      
      const photo = await this.getUserPhoto(user.id);
      
      return {
        id: user.id,
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        department: user.department,
        mail: user.mail,
        userPrincipalName: user.userPrincipalName,
        photo
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  private async getUserPhoto(userId: string): Promise<string | undefined> {
    try {
      const client = await this.getClient();
      const photoBlob: Blob = await client
        .api(`/users/${userId}/photo/$value`)
        .get();
      
      // Check if we got a valid blob
      if (!photoBlob || photoBlob.size === 0) {
        return undefined;
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(photoBlob);
      });
    } catch {
      // 404 is expected when user has no photo - silently return undefined
      return undefined;
    }
  }

  public async getDirectReports(userId: string): Promise<IGraphUser[]> {
    try {
      const client = await this.getClient();
      const response = await client
        .api(`/users/${userId}/directReports`)
        .select('id,displayName,jobTitle,department,mail,userPrincipalName')
        .get();
      
      // Fetch photos in parallel for better performance
      const userPromises = response.value.map(async (user: IGraphUser) => {
        const photo = await this.getUserPhoto(user.id);
        return {
          id: user.id,
          displayName: user.displayName,
          jobTitle: user.jobTitle,
          department: user.department,
          mail: user.mail,
          userPrincipalName: user.userPrincipalName,
          photo
        };
      });
      
      return Promise.all(userPromises);
    } catch (error) {
      console.error('Error fetching direct reports:', error);
      return [];
    }
  }

  public async buildOrgTree(rootEmail: string, maxDepth: number = 5): Promise<IOrgMember[]> {
    const members: IOrgMember[] = [];
    
    const rootUser = await this.getUserByEmail(rootEmail);
    if (!rootUser) {
      console.error('Root user not found:', rootEmail);
      return [];
    }

    const rootMember: IOrgMember = {
      ...rootUser,
      initials: this.getInitials(rootUser.displayName)
    };
    members.push(rootMember);

    await this.fetchReportsRecursively(rootUser.id, members, maxDepth, 1);

    return members;
  }

  private async fetchReportsRecursively(
    parentId: string,
    members: IOrgMember[],
    maxDepth: number,
    currentDepth: number
  ): Promise<void> {
    if (currentDepth > maxDepth) return;

    const directReports = await this.getDirectReports(parentId);

    // Add all reports to members first
    for (const report of directReports) {
      const member: IOrgMember = {
        ...report,
        parent: parentId,
        initials: this.getInitials(report.displayName)
      };
      members.push(member);
    }

    // Then fetch sub-reports in parallel for better performance
    await Promise.all(
      directReports.map(report => 
        this.fetchReportsRecursively(report.id, members, maxDepth, currentDepth + 1)
      )
    );
  }
}
