export interface CustomLoginConfig {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  customHtmlTemplate?: string;
}

export interface BrandingResponseDto {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  customLoginConfig: CustomLoginConfig | null;
}
