import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'SampleWebPartWebPartStrings';
import OrgChart from './components/OrgChart';
import { IOrgChartProps } from './components/IOrgChartProps';

export interface IOrgChartWebPartProps {
  description: string;
  rootUserEmail: string;
  maxDepth: number;
}

export default class OrgChartWebPart extends BaseClientSideWebPart<IOrgChartWebPartProps> {

  private _isDarkTheme: boolean = false;

  public render(): void {
    // Make the web part container fill the available space
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.minHeight = 'calc(100vh - 150px)';
    
    const element: React.ReactElement<IOrgChartProps> = React.createElement(
      OrgChart,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        width: this.domElement.clientWidth,
        height: window.innerHeight - 150,
        rootUserEmail: this.properties.rootUserEmail || '',
        maxDepth: this.properties.maxDepth || 5,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return Promise.resolve();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('rootUserEmail', {
                  label: 'Root User Email',
                  description: 'Enter the email address of the VP or manager at the top of the org chart (e.g., vp@company.com). Leave empty for demo data.',
                  placeholder: 'user@company.com'
                }),
                PropertyPaneSlider('maxDepth', {
                  label: 'Maximum Depth',
                  min: 1,
                  max: 10,
                  value: 5,
                  step: 1
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
