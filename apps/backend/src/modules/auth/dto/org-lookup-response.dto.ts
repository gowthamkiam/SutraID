export interface CustomLoginConfig {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  customHtmlTemplate?: string;
}

export interface OrgLookupResponseDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  customLoginConfig: CustomLoginConfig | null;
}
