export interface FramePickerConfig {
  environment: 'development' | 'staging' | 'production';
  allowedOrigins: string;
  retainResources: boolean;
}

export const getConfig = (environment?: string): FramePickerConfig => {
  const env = (environment ||
    process.env.NODE_ENV ||
    'development') as FramePickerConfig['environment'];

  switch (env) {
    case 'production':
      return {
        environment: 'production',
        allowedOrigins:
          process.env.ALLOWED_ORIGINS || 'https://your-domain.com',
        retainResources: true,
      };

    case 'staging':
      return {
        environment: 'staging',
        allowedOrigins:
          process.env.ALLOWED_ORIGINS || 'https://staging.your-domain.com',
        retainResources: false,
      };

    default:
      return {
        environment: 'development',
        allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
        retainResources: false,
      };
  }
};
