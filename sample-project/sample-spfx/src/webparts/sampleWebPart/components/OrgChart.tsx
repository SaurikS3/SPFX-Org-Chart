import * as React from 'react';
import { IOrgChartProps } from './IOrgChartProps';
import styles from './OrgChart.module.scss';
import { GraphService, IOrgMember } from '../services/GraphService';

// Sample organizational data for demo mode (when no root email is configured)
const demoData: IOrgMember[] = [
  { id: '1', displayName: 'John Smith', jobTitle: 'Chief Executive Officer', department: 'Executive', initials: 'JS' },
  { id: '2', displayName: 'Sarah Johnson', jobTitle: 'Chief Technology Officer', department: 'Technology', initials: 'SJ', parent: '1' },
  { id: '3', displayName: 'Mike Williams', jobTitle: 'Chief Financial Officer', department: 'Finance', initials: 'MW', parent: '1' },
  { id: '4', displayName: 'Emily Brown', jobTitle: 'Chief Operating Officer', department: 'Operations', initials: 'EB', parent: '1' },
  { id: '5', displayName: 'David Lee', jobTitle: 'VP of Engineering', department: 'Engineering', initials: 'DL', parent: '2' },
  { id: '6', displayName: 'Lisa Chen', jobTitle: 'VP of Product', department: 'Product', initials: 'LC', parent: '2' },
  { id: '7', displayName: 'Tom Davis', jobTitle: 'VP of Finance', department: 'Finance', initials: 'TD', parent: '3' },
  { id: '8', displayName: 'Anna Wilson', jobTitle: 'VP of Operations', department: 'Operations', initials: 'AW', parent: '4' },
  { id: '9', displayName: 'James Taylor', jobTitle: 'Senior Software Engineer', department: 'Engineering', initials: 'JT', parent: '5' },
  { id: '10', displayName: 'Maria Garcia', jobTitle: 'Product Manager', department: 'Product', initials: 'MG', parent: '6' }
];

interface IOrgChartState {
  orgData: IOrgMember[];
  collapsedNodes: Set<string>;
  scale: number;
  translateX: number;
  translateY: number;
  selectedNode: string | null;
  searchQuery: string;
  searchResults: IOrgMember[];
  isLoading: boolean;
  error: string | null;
  isPresentationMode: boolean;
  showMiniMap: boolean;
  // Presentation slideshow state
  slideIndex: number;
  isPlaying: boolean;
  slideMembers: IOrgMember[];
  // Details panel tab
  detailsTab: 'overview' | 'org' | 'team';
}

export default class OrgChart extends React.Component<IOrgChartProps, IOrgChartState> {
  private containerRef: React.RefObject<HTMLDivElement>;
  private nodeRefs: { [key: string]: React.RefObject<HTMLDivElement> } = {};
  private graphService: GraphService;

  constructor(props: IOrgChartProps) {
    super(props);
    this.containerRef = React.createRef();
    this.graphService = new GraphService(props.context);
    
    this.state = {
      orgData: [],
      collapsedNodes: new Set<string>(),
      scale: 0.85,
      translateX: 0,
      translateY: 0,
      selectedNode: null,
      searchQuery: '',
      searchResults: [],
      isLoading: true,
      error: null,
      isPresentationMode: false,
      showMiniMap: true,
      slideIndex: 0,
      isPlaying: false,
      slideMembers: [],
      detailsTab: 'overview',
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.loadOrgData();
  }

  private collapseToLevel(level: number): void {
    const collapsedNodes = new Set<string>();
    
    const getDepth = (memberId: string): number => {
      const member = this.state.orgData.find(m => m.id === memberId);
      if (!member || !member.parent) return 0;
      return 1 + getDepth(member.parent);
    };

    this.state.orgData.forEach(member => {
      const depth = getDepth(member.id);
      if (depth >= level - 1 && this.getChildren(member.id).length > 0) {
        collapsedNodes.add(member.id);
      }
    });

    this.setState({ collapsedNodes });
  }

  private expandAll = (): void => {
    this.setState({ collapsedNodes: new Set<string>() });
  };

  private collapseAll = (): void => {
    const collapsedNodes = new Set<string>();
    this.state.orgData.forEach(member => {
      if (this.getChildren(member.id).length > 0) {
        collapsedNodes.add(member.id);
      }
    });
    this.setState({ collapsedNodes });
  };

  private showLevel = (level: number): void => {
    this.collapseToLevel(level);
  };

  public async componentDidUpdate(prevProps: IOrgChartProps): Promise<void> {
    if (prevProps.rootUserEmail !== this.props.rootUserEmail || 
        prevProps.maxDepth !== this.props.maxDepth) {
      await this.loadOrgData();
    }
  }

  private async loadOrgData(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      let data: IOrgMember[];

      if (this.props.rootUserEmail && this.props.rootUserEmail.trim()) {
        data = await this.graphService.buildOrgTree(
          this.props.rootUserEmail.trim(),
          this.props.maxDepth
        );

        if (data.length === 0) {
          this.setState({
            error: `Could not find user "${this.props.rootUserEmail}" or they have no direct reports. Using demo data.`,
            orgData: demoData,
            isLoading: false
          });
          this.createNodeRefs(demoData);
          return;
        }
      } else {
        data = demoData;
      }
      
      const initialCollapsed = new Set<string>();
      const getDepth = (memberId: string, allData: IOrgMember[]): number => {
        const member = allData.find(m => m.id === memberId);
        if (!member || !member.parent) return 0;
        return 1 + getDepth(member.parent, allData);
      };
      
      data.forEach(member => {
        const depth = getDepth(member.id, data);
        const hasChildren = data.some(m => m.parent === member.id);
        if (depth >= 1 && hasChildren) {
          initialCollapsed.add(member.id);
        }
      });

      this.setState({ orgData: data, isLoading: false, collapsedNodes: initialCollapsed });
      this.createNodeRefs(data);
    } catch (error) {
      this.setState({
        error: 'Failed to load organization data. Using demo data.',
        orgData: demoData,
        isLoading: false
      });
      this.createNodeRefs(demoData);
    }
  }

  private createNodeRefs(data: IOrgMember[]): void {
    this.nodeRefs = {};
    data.forEach(member => {
      this.nodeRefs[member.id] = React.createRef();
    });
  }

  private getChildren(parentId: string): IOrgMember[] {
    return this.state.orgData.filter(m => m.parent === parentId);
  }

  // Get siblings (people with same manager)
  private getSiblings(memberId: string): IOrgMember[] {
    const member = this.state.orgData.find(m => m.id === memberId);
    if (!member || !member.parent) return [];
    return this.state.orgData.filter(m => m.parent === member.parent && m.id !== memberId);
  }


  private isVisible(memberId: string): boolean {
    const member = this.state.orgData.find(m => m.id === memberId);
    if (!member || !member.parent) return true;
    
    let current = member;
    while (current.parent) {
      if (this.state.collapsedNodes.has(current.parent)) {
        return false;
      }
      const parent = this.state.orgData.find(m => m.id === current.parent);
      if (!parent) break;
      current = parent;
    }
    return true;
  }

  private expandToNode(memberId: string): void {
    const member = this.state.orgData.find(m => m.id === memberId);
    if (!member) return;
    
    const newCollapsed = new Set(this.state.collapsedNodes);
    let current = member;
    
    while (current.parent) {
      newCollapsed.delete(current.parent);
      const parent = this.state.orgData.find(m => m.id === current.parent);
      if (!parent) break;
      current = parent;
    }
    
    this.setState({ collapsedNodes: newCollapsed });
  }

  // Get the current path - based on selection if selected, otherwise expanded path
  private getCurrentPath(): IOrgMember[] {
    const { orgData, collapsedNodes, selectedNode } = this.state;
    
    // If a node is selected, use that path
    if (selectedNode) {
      return this.getBreadcrumb(selectedNode);
    }
    
    // Otherwise, trace the expanded path
    const rootMember = orgData.find(m => !m.parent);
    if (!rootMember) return [];

    const path: IOrgMember[] = [rootMember];
    let current = rootMember;

    while (true) {
      // If current is collapsed, stop here
      if (collapsedNodes.has(current.id)) break;
      
      // Get expanded children
      const children = this.getChildren(current.id);
      if (children.length === 0) break;
      
      // Find the first non-collapsed child that has children, or just first child
      const nextInPath = children.find(c => !collapsedNodes.has(c.id) && this.getChildren(c.id).length > 0) || children[0];
      path.push(nextInPath);
      current = nextInPath;
    }

    return path;
  }

  private toggleCollapse = (memberId: string): void => {
    this.setState(prevState => {
      const newCollapsed = new Set(prevState.collapsedNodes);
      const isCurrentlyCollapsed = newCollapsed.has(memberId);
      
      if (isCurrentlyCollapsed) {
        newCollapsed.delete(memberId);
        const member = this.state.orgData.find(m => m.id === memberId);
        if (member && member.parent) {
          const siblings = this.state.orgData.filter(m => m.parent === member.parent && m.id !== memberId);
          siblings.forEach(sibling => {
            if (this.getChildren(sibling.id).length > 0) {
              newCollapsed.add(sibling.id);
            }
          });
        }
      } else {
        newCollapsed.add(memberId);
      }
      return { collapsedNodes: newCollapsed };
    });
  };

  private selectNode = (memberId: string): void => {
    this.setState({ selectedNode: memberId, detailsTab: 'overview' });
  };

  // Enhanced search - matches are kept, non-matches fade
  private handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value.toLowerCase();
    
    if (query.length === 0) {
      this.setState({ searchQuery: '', searchResults: [] });
      return;
    }

    const results = this.state.orgData.filter(member => {
      const name = member.displayName.toLowerCase();
      const title = (member.jobTitle || '').toLowerCase();
      const dept = (member.department || '').toLowerCase();
      return name.includes(query) || title.includes(query) || dept.includes(query);
    });

    this.setState({ searchQuery: query, searchResults: results });
  };

  // Check if member matches current search
  private matchesSearch(memberId: string): boolean {
    if (!this.state.searchQuery) return true;
    return this.state.searchResults.some(m => m.id === memberId);
  }

  private scrollToUser = (memberId: string): void => {
    this.expandToNode(memberId);
    this.setState({ selectedNode: memberId, searchQuery: '', searchResults: [], detailsTab: 'overview' });
    
    setTimeout(() => {
      const nodeRef = this.nodeRefs[memberId];
      if (nodeRef && nodeRef.current) {
        nodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        nodeRef.current.style.animation = 'none';
        nodeRef.current.offsetHeight;
        nodeRef.current.style.animation = 'highlightPulse 1.5s ease-out';
      }
    }, 150);
  };

  // Navigate to a node and collapse everything below it
  private navigateToLevel = (memberId: string): void => {
    const path = this.getBreadcrumb(memberId);
    const newCollapsed = new Set<string>();
    
    // Expand path to this node
    path.forEach(m => newCollapsed.delete(m.id));
    
    // Collapse all nodes that are not ancestors of the target
    this.state.orgData.forEach(m => {
      const hasChildren = this.getChildren(m.id).length > 0;
      if (hasChildren) {
        const isInPath = path.some(p => p.id === m.id);
        // Collapse the target node and anything not in the path
        if (!isInPath || m.id === memberId) {
          newCollapsed.add(m.id);
        }
      }
    });
    
    // But keep the target node expanded if it has children
    newCollapsed.delete(memberId);
    
    this.setState({ 
      selectedNode: memberId, 
      collapsedNodes: newCollapsed,
      detailsTab: 'overview' 
    });
    
    setTimeout(() => {
      const nodeRef = this.nodeRefs[memberId];
      if (nodeRef && nodeRef.current) {
        nodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 150);
  };


  private getAvatarColor(member: IOrgMember): string {
    const colors = ['#0078d4', '#00a36c', '#744da9', '#d13438', '#ff8c00', '#107c10'];
    let hash = 0;
    for (let i = 0; i < member.id.length; i++) {
      hash = member.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  private getDescendantCount(memberId: string): number {
    const children = this.getChildren(memberId);
    let count = children.length;
    children.forEach(child => {
      count += this.getDescendantCount(child.id);
    });
    return count;
  }

  // Get role breakdown for badge tooltip
  private getRoleBreakdown(memberId: string): { managers: number; ics: number; depts: string[] } {
    const descendants = this.getAllDescendants(memberId);
    let managers = 0;
    let ics = 0;
    const deptSet = new Set<string>();
    
    descendants.forEach(d => {
      if (this.getChildren(d.id).length > 0) {
        managers++;
      } else {
        ics++;
      }
      if (d.department) deptSet.add(d.department);
    });
    
    return { managers, ics, depts: Array.from(deptSet) };
  }

  private getAllDescendants(memberId: string): IOrgMember[] {
    const children = this.getChildren(memberId);
    let all = [...children];
    children.forEach(child => {
      all = [...all, ...this.getAllDescendants(child.id)];
    });
    return all;
  }

  private getInitials(member: IOrgMember): string {
    if (member.initials) return member.initials;
    return member.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  private slideInterval: ReturnType<typeof setInterval> | null = null;

  private togglePresentationMode = (): void => {
    if (!this.state.isPresentationMode) {
      const slideMembers = this.state.orgData.slice(0, 20);
      this.setState({ 
        isPresentationMode: true,
        slideMembers,
        slideIndex: 0,
        isPlaying: true
      }, () => {
        this.startSlideshow();
      });
    } else {
      this.stopSlideshow();
      this.setState({ isPresentationMode: false, isPlaying: false });
    }
  };

  private startSlideshow = (): void => {
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.slideInterval = setInterval(() => {
      this.setState(prev => ({
        slideIndex: (prev.slideIndex + 1) % prev.slideMembers.length
      }));
    }, 4000);
  };

  private stopSlideshow = (): void => {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  };

  private togglePlayPause = (): void => {
    if (this.state.isPlaying) {
      this.stopSlideshow();
      this.setState({ isPlaying: false });
    } else {
      this.startSlideshow();
      this.setState({ isPlaying: true });
    }
  };

  private nextSlide = (): void => {
    this.setState(prev => ({
      slideIndex: (prev.slideIndex + 1) % prev.slideMembers.length
    }));
  };

  private prevSlide = (): void => {
    this.setState(prev => ({
      slideIndex: prev.slideIndex === 0 ? prev.slideMembers.length - 1 : prev.slideIndex - 1
    }));
  };

  // Calculate compact tree layout - fits all nodes on screen
  private calculateCompactTreeLayout(): { 
    nodes: { member: IOrgMember; x: number; y: number; level: number }[];
    connections: { from: { x: number; y: number }; to: { x: number; y: number } }[];
    maxLevel: number;
  } {
    const { orgData } = this.state;
    const rootMember = orgData.find(m => !m.parent);
    if (!rootMember) return { nodes: [], connections: [], maxLevel: 0 };

    // Group members by level
    const levels: IOrgMember[][] = [];
    const memberLevels: Map<string, number> = new Map();
    
    const assignLevel = (memberId: string, level: number): void => {
      memberLevels.set(memberId, level);
      if (!levels[level]) levels[level] = [];
      levels[level].push(orgData.find(m => m.id === memberId)!);
      
      const children = this.getChildren(memberId);
      children.forEach(child => assignLevel(child.id, level + 1));
    };
    
    assignLevel(rootMember.id, 0);
    
    const maxLevel = levels.length - 1;
    const nodes: { member: IOrgMember; x: number; y: number; level: number }[] = [];
    const connections: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    const nodePositions: Map<string, { x: number; y: number }> = new Map();
    
    // Calculate positions - spread vertically, levels go horizontally
    const paddingX = 4; // percentage
    const paddingY = 8;
    const usableWidth = 100 - paddingX * 2;
    const usableHeight = 100 - paddingY * 2;
    
    const levelWidth = usableWidth / (maxLevel + 1);
    
    levels.forEach((levelMembers, levelIdx) => {
      const levelHeight = usableHeight / levelMembers.length;
      
      levelMembers.forEach((member, idx) => {
        const x = paddingX + levelIdx * levelWidth + levelWidth / 2;
        const y = paddingY + idx * levelHeight + levelHeight / 2;
        
        nodes.push({ member, x, y, level: levelIdx });
        nodePositions.set(member.id, { x, y });
      });
    });
    
    // Create connections
    orgData.forEach(member => {
      if (member.parent) {
        const fromPos = nodePositions.get(member.parent);
        const toPos = nodePositions.get(member.id);
        if (fromPos && toPos) {
          connections.push({ from: fromPos, to: toPos });
        }
      }
    });
    
    return { nodes, connections, maxLevel };
  }

  private renderPresentationMode(): React.ReactNode {
    const { orgData } = this.state;
    const rootMember = orgData.find(m => !m.parent);
    if (!rootMember) return null;

    const { nodes, connections, maxLevel } = this.calculateCompactTreeLayout();
    const totalCount = orgData.length;

    // Calculate node size based on total count - smaller for more people
    const baseSize = Math.max(24, Math.min(56, 800 / totalCount));
    
    // Department colors
    const deptColors: { [key: string]: string } = {};
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];
    let colorIdx = 0;
    orgData.forEach(m => {
      if (m.department && !deptColors[m.department]) {
        deptColors[m.department] = colors[colorIdx % colors.length];
        colorIdx++;
      }
    });

    return (
      <div className={styles.presentationView}>
        {/* Header */}
        <div className={styles.presentHeader}>
          <div className={styles.presentHeaderLeft}>
            <h1>{rootMember.displayName}'s Organization</h1>
            <span className={styles.presentSubtitle}>{rootMember.jobTitle}</span>
          </div>
          <div className={styles.presentHeaderRight}>
            <span className={styles.presentCount}>{totalCount} Team Members</span>
            <span className={styles.presentLevels}>{maxLevel + 1} Levels</span>
            <button className={styles.presentExit} onClick={this.togglePresentationMode}>
              ✕ Exit
            </button>
          </div>
        </div>

        {/* Compact Tree */}
        <div className={styles.compactTreeContainer}>
          {/* Connection lines */}
          <svg className={styles.compactTreeLines}>
            {connections.map((conn, idx) => {
              const midX = (conn.from.x + conn.to.x) / 2;
              return (
                <path
                  key={idx}
                  d={`M ${conn.from.x}% ${conn.from.y}% 
                      C ${midX}% ${conn.from.y}%, 
                        ${midX}% ${conn.to.y}%, 
                        ${conn.to.x}% ${conn.to.y}%`}
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.4)"
                  strokeWidth="2"
                  className={styles.connectionLine}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isRoot = node.level === 0;
            const hasChildren = this.getChildren(node.member.id).length > 0;
            const nodeSize = isRoot ? baseSize * 1.5 : baseSize;
            const color = node.member.department ? deptColors[node.member.department] : this.getAvatarColor(node.member);
            
            return (
              <div
                key={node.member.id}
                className={`${styles.compactNode} ${isRoot ? styles.compactNodeRoot : ''} ${hasChildren ? styles.compactNodeManager : ''}`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: nodeSize,
                  height: nodeSize,
                  background: `linear-gradient(135deg, ${color}, ${this.adjustColor(color, -20)})`,
                  animationDelay: `${node.level * 0.1}s`,
                }}
                title={`${node.member.displayName}\n${node.member.jobTitle || ''}\n${node.member.department || ''}`}
              >
                {node.member.photo ? (
                  <img src={node.member.photo} alt="" className={styles.compactNodePhoto} />
                ) : (
                  <span className={styles.compactNodeInitials} style={{ fontSize: nodeSize * 0.35 }}>
                    {this.getInitials(node.member)}
                  </span>
                )}
                {/* Name tooltip on hover */}
                <div className={styles.compactNodeTooltip}>
                  <div className={styles.tooltipName}>{node.member.displayName}</div>
                  <div className={styles.tooltipTitle}>{node.member.jobTitle || 'Team Member'}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={styles.compactLegend}>
          {Object.keys(deptColors).slice(0, 8).map((dept: string) => (
            <div key={dept} className={styles.compactLegendItem}>
              <span style={{ background: deptColors[dept] }} />
              {dept}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Helper to darken/lighten a hex color
  private adjustColor(color: string, amount: number): string {
    const clamp = (val: number): number => Math.min(255, Math.max(0, val));
    const hex = color.replace('#', '');
    const r = clamp(parseInt(hex.substring(0, 2), 16) + amount);
    const g = clamp(parseInt(hex.substring(2, 4), 16) + amount);
    const b = clamp(parseInt(hex.substring(4, 6), 16) + amount);
    const pad = (s: string): string => s.length < 2 ? '0' + s : s;
    return `#${pad(r.toString(16))}${pad(g.toString(16))}${pad(b.toString(16))}`;
  }

  private toggleMiniMap = (): void => {
    this.setState(prevState => ({ showMiniMap: !prevState.showMiniMap }));
  };

  private getBreadcrumb(memberId: string): IOrgMember[] {
    const path: IOrgMember[] = [];
    let current = this.state.orgData.find(m => m.id === memberId);
    
    while (current) {
      path.unshift(current);
      if (current.parent) {
        current = this.state.orgData.find(m => m.id === current!.parent);
      } else {
        break;
      }
    }
    return path;
  }

  // Enhanced Command Path breadcrumb - shows current path (selection or expanded)
  private renderBreadcrumb(): React.ReactNode {
    const path = this.getCurrentPath();
    if (path.length <= 1) return null; // Only show if there's a meaningful path

    return (
      <div className={styles.breadcrumb}>
        {path.map((member, index) => {
          const avatarColor = this.getAvatarColor(member);
          const isLast = index === path.length - 1;
          const isSelected = this.state.selectedNode === member.id;
          return (
            <React.Fragment key={member.id}>
              <div 
                className={`${styles.breadcrumbChip} ${isLast || isSelected ? styles.active : ''}`}
                onClick={() => this.navigateToLevel(member.id)}
                title={`${member.displayName} - ${member.jobTitle || 'Team Member'} (click to navigate here)`}
              >
                <div className={styles.breadcrumbAvatar} style={{ background: avatarColor }}>
                  {member.photo ? (
                    <img src={member.photo} alt="" />
                  ) : (
                    this.getInitials(member)
                  )}
                </div>
                <span className={styles.breadcrumbName}>{member.displayName.split(' ')[0]}</span>
              </div>
              {!isLast && <span className={styles.breadcrumbSeparator}>›</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  private renderMiniMap(): React.ReactNode {
    if (this.state.orgData.length === 0) return null;

    // Use current path - respects selection or expanded state
    const path = this.getCurrentPath();
    
    // Only show if there's a meaningful path (more than just root)
    if (path.length <= 1) return null;

    if (!this.state.showMiniMap) {
      return (
        <button 
          className={styles.miniMapToggle}
          onClick={this.toggleMiniMap}
          title="Show Path"
        >
          <span>📍</span>
          Path ({path.length})
        </button>
      );
    }

    return (
      <div className={styles.miniMap} style={{ height: 'auto', minHeight: 80 }}>
        <div className={styles.miniMapHeader}>
          <span className={styles.miniMapTitle}>Current Path ({path.length} levels)</span>
          <button className={styles.miniMapClose} onClick={this.toggleMiniMap}>×</button>
        </div>
        <div className={styles.miniMapContent}>
          {path.map((member, index) => {
            const isLast = index === path.length - 1;
            const avatarColor = this.getAvatarColor(member);
            const isSelected = this.state.selectedNode === member.id;
            
            return (
              <React.Fragment key={member.id}>
                <div 
                  className={`${styles.miniMapItem} ${isLast || isSelected ? styles.selected : ''}`}
                  onClick={() => this.navigateToLevel(member.id)}
                  title={`${member.displayName} - ${member.jobTitle || 'Team Member'} (click to navigate)`}
                >
                  <div className={styles.miniMapAvatar} style={{ background: avatarColor }}>
                    {member.photo ? (
                      <img src={member.photo} alt={member.displayName} />
                    ) : (
                      this.getInitials(member)
                    )}
                  </div>
                  <div className={styles.miniMapInfo}>
                    <div className={styles.miniMapName}>
                      {member.displayName.split(' ')[0]}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className={styles.miniMapConnector}>
                    <span>→</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  private renderNode(member: IOrgMember): React.ReactNode {
    if (!this.isVisible(member.id)) return null;

    const children = this.getChildren(member.id);
    const hasKids = children.length > 0;
    const isCollapsed = this.state.collapsedNodes.has(member.id);
    const isSelected = this.state.selectedNode === member.id;
    const avatarColor = this.getAvatarColor(member);
    const descendantCount = this.getDescendantCount(member.id);
    const matchesSearch = this.matchesSearch(member.id);

    // Apply opacity for search filtering
    const opacity = !matchesSearch ? 0.3 : 1;

    return (
      <li key={member.id} className={styles.orgLi} style={{ opacity }}>
        <div 
          ref={this.nodeRefs[member.id]}
          className={`${styles.orgNode} ${isSelected ? styles.selected : ''}`}
          onClick={() => this.selectNode(member.id)}
        >
          <div className={styles.nodeContent}>
            <div className={styles.avatarContainer}>
              {member.photo ? (
                <img 
                  src={member.photo} 
                  alt={member.displayName} 
                  className={styles.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) (fallback as HTMLElement).classList.remove(styles.hidden);
                  }}
                />
              ) : null}
              <div 
                className={`${styles.avatarFallback} ${member.photo ? styles.hidden : ''}`} 
                style={{ background: avatarColor }}
              >
                {this.getInitials(member)}
              </div>
            </div>
            <div className={styles.nodeInfo}>
              <div className={styles.nodeName}>{member.displayName}</div>
              <div className={styles.nodeTitle}>{member.jobTitle || 'No title'}</div>
              {member.department && (
                <div className={styles.nodeDepartment}>{member.department}</div>
              )}
            </div>
            {hasKids && (
              <button
                className={`${styles.toggleBtn} ${isCollapsed ? styles.collapsed : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  this.toggleCollapse(member.id);
                }}
                title={isCollapsed ? `Expand - ${descendantCount} people` : 'Collapse branch'}
              >
                {isCollapsed ? (
                  <span className={styles.expandIcon}>
                    <span className={styles.iconPlus}>+</span>
                    <span className={styles.badge}>{descendantCount}</span>
                  </span>
                ) : (
                  <span className={styles.collapseIcon}>−</span>
                )}
              </button>
            )}
          </div>
        </div>
        {hasKids && !isCollapsed && (
          <ul className={styles.orgUl}>
            {children.map(child => this.renderNode(child))}
          </ul>
        )}
      </li>
    );
  }

  // Enhanced details panel with tabs
  private renderSelectedDetails(): React.ReactNode {
    if (!this.state.selectedNode) return null;
    
    const member = this.state.orgData.find(m => m.id === this.state.selectedNode);
    if (!member) return null;

    const parent = member.parent ? this.state.orgData.find(m => m.id === member.parent) : null;
    const children = this.getChildren(member.id);
    const siblings = this.getSiblings(member.id);
    const avatarColor = this.getAvatarColor(member);
    const { detailsTab } = this.state;

    return (
      <div className={styles.detailsPanel}>
        <button 
          className={styles.closeBtn}
          onClick={() => this.setState({ selectedNode: null })}
        >
          ×
        </button>
        <div className={styles.detailsHeader}>
          <div className={styles.detailsAvatar}>
            {member.photo ? (
              <img src={member.photo} alt={member.displayName} />
            ) : (
              <div className={styles.avatarFallback} style={{ background: avatarColor, width: 64, height: 64, fontSize: 24 }}>
                {this.getInitials(member)}
              </div>
            )}
          </div>
          <div className={styles.detailsInfo}>
            <h3>{member.displayName}</h3>
            <p>{member.jobTitle || 'No title'}</p>
            {member.department && <span className={styles.dept}>{member.department}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.detailsTabs}>
          <button 
            className={`${styles.tabBtn} ${detailsTab === 'overview' ? styles.active : ''}`}
            onClick={() => this.setState({ detailsTab: 'overview' })}
          >
            Overview
          </button>
          <button 
            className={`${styles.tabBtn} ${detailsTab === 'org' ? styles.active : ''}`}
            onClick={() => this.setState({ detailsTab: 'org' })}
          >
            Org
          </button>
          <button 
            className={`${styles.tabBtn} ${detailsTab === 'team' ? styles.active : ''}`}
            onClick={() => this.setState({ detailsTab: 'team' })}
          >
            Team
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.detailsTabContent}>
          {detailsTab === 'overview' && (
            <>
              {member.mail && (
                <div className={styles.detailsSection}>
                  <h4>Contact</h4>
                  <p style={{ fontSize: 13, color: '#0078d4' }}>{member.mail}</p>
                </div>
              )}
              {parent && (
                <div className={styles.detailsSection}>
                  <h4>Reports To</h4>
                  <div className={styles.miniCard} onClick={() => this.scrollToUser(parent.id)}>
                    <div className={styles.miniAvatar}>
                      {parent.photo ? (
                        <img src={parent.photo} alt={parent.displayName} />
                      ) : (
                        <span style={{ background: this.getAvatarColor(parent) }}>
                          {this.getInitials(parent)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className={styles.miniName}>{parent.displayName}</div>
                      <div className={styles.miniTitle}>{parent.jobTitle || 'No title'}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {detailsTab === 'org' && (
            <>
              {/* Peers */}
              {siblings.length > 0 && (
                <div className={styles.detailsSection}>
                  <h4>Peers ({siblings.length})</h4>
                  {siblings.slice(0, 5).map(sibling => (
                    <div key={sibling.id} className={styles.miniCard} onClick={() => this.scrollToUser(sibling.id)}>
                      <div className={styles.miniAvatar}>
                        {sibling.photo ? (
                          <img src={sibling.photo} alt={sibling.displayName} />
                        ) : (
                          <span style={{ background: this.getAvatarColor(sibling) }}>
                            {this.getInitials(sibling)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={styles.miniName}>{sibling.displayName}</div>
                        <div className={styles.miniTitle}>{sibling.jobTitle || 'No title'}</div>
                      </div>
                    </div>
                  ))}
                  {siblings.length > 5 && (
                    <div className={styles.moreIndicator}>+{siblings.length - 5} more peers</div>
                  )}
                </div>
              )}
            </>
          )}

          {detailsTab === 'team' && (
            <>
              {children.length > 0 ? (
                <div className={styles.detailsSection}>
                  <h4>Direct Reports ({children.length})</h4>
                  {children.map(child => (
                    <div key={child.id} className={styles.miniCard} onClick={() => this.scrollToUser(child.id)}>
                      <div className={styles.miniAvatar}>
                        {child.photo ? (
                          <img src={child.photo} alt={child.displayName} />
                        ) : (
                          <span style={{ background: this.getAvatarColor(child) }}>
                            {this.getInitials(child)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={styles.miniName}>{child.displayName}</div>
                        <div className={styles.miniTitle}>{child.jobTitle || 'No title'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.detailsSection}>
                  <p style={{ color: '#666', fontSize: 13 }}>No direct reports</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  public render(): React.ReactElement<IOrgChartProps> {
    const { searchQuery, searchResults, isLoading, error, orgData, isPresentationMode } = this.state;
    const rootMember = orgData.find(m => !m.parent);

    if (isPresentationMode) {
      return (
        <div className={`${styles.orgChart} ${styles.presentationMode}`}>
          {this.renderPresentationMode()}
        </div>
      );
    }

    return (
      <div className={styles.orgChart}>
        <div className={styles.toolbar}>
          <h2>Organization Chart</h2>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search name, title, or department..."
              value={searchQuery}
              onChange={this.handleSearch}
              className={styles.searchInput}
            />
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.slice(0, 8).map(member => (
                  <div
                    key={member.id}
                    className={styles.searchResultItem}
                    onClick={() => this.scrollToUser(member.id)}
                  >
                    <span className={styles.searchAvatar} style={{ background: this.getAvatarColor(member) }}>
                      {this.getInitials(member)}
                    </span>
                    <div>
                      <div className={styles.searchName}>{member.displayName}</div>
                      <div className={styles.searchTitle}>{member.jobTitle || 'No title'}</div>
                    </div>
                    {/* Show breadcrumb preview */}
                    <div className={styles.searchPath}>
                      {this.getBreadcrumb(member.id).slice(0, -1).map(p => p.displayName.split(' ')[0]).join(' › ')}
                    </div>
                  </div>
                ))}
                {searchResults.length > 8 && (
                  <div className={styles.searchMore}>+{searchResults.length - 8} more results</div>
                )}
              </div>
            )}
          </div>
          <div className={styles.viewControls}>
            <button onClick={this.expandAll} title="Expand all" className={styles.controlBtn}>
              Expand
            </button>
            <button onClick={this.collapseAll} title="Collapse all" className={styles.controlBtn}>
              Collapse
            </button>
            <button onClick={() => this.showLevel(2)} title="Level 2" className={styles.controlBtn}>
              L2
            </button>
            <button onClick={() => this.showLevel(3)} title="Level 3" className={styles.controlBtn}>
              L3
            </button>
            <button 
              onClick={this.togglePresentationMode}
              className={styles.presentationBtn}
            >
              📺 Present
            </button>
          </div>
        </div>
        
        {this.renderBreadcrumb()}
        
        {error && (
          <div style={{ padding: '10px 20px', background: '#fff4ce', borderBottom: '1px solid #ffb900', color: '#323130', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        
        <div className={styles.chartWrapper}>
          {this.renderMiniMap()}
          <div 
            ref={this.containerRef}
            className={styles.chartContainer}
          >
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666',
                fontSize: 16
              }}>
                <span>Loading organization data...</span>
              </div>
            ) : (
              <div className={styles.chartContent}>
                <ul className={styles.orgUl}>
                  {rootMember && this.renderNode(rootMember)}
                </ul>
              </div>
            )}
          </div>
          {this.renderSelectedDetails()}
        </div>
      </div>
    );
  }
}
