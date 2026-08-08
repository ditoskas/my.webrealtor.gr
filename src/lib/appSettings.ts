const appSettings = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  environment: process.env.NODE_ENV,
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
};

export default appSettings;
