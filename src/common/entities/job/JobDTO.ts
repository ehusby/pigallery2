import {backendText} from '../../BackendTexts';

export type fieldType = 'string' | 'number' | 'boolean' | 'number-array';


export enum DefaultsJobs {
  Indexing = 1,
  'Database Reset' = 2,
  'Video Converting' = 3,
  'Photo Converting' = 4,
  'Thumbnail Generation' = 5,
  'Temp Folder Cleaning' = 6
}

export interface ConfigTemplateEntry {
  id: string;
  name: backendText;
  description: backendText;
  type: fieldType;
  defaultValue: any;
}

export interface JobDTO {
  Name: string;
  ConfigTemplate: ConfigTemplateEntry[];
}

export const JobDTOUtils = {
  getHashName: (jobName: string, config: any = {}) => {
    return jobName + '-' + JSON.stringify(config);
  }
};
