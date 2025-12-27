export interface Property {
  id: string | number;
  addressText: string;
  priceText?: string;
  saleType?: string;
  propertyType?: string;
  agentText?: string;
  bathroomsText?: string;
  bedroomsText?: string;
  pictureCount?: number;
  photoUrls?: string[];
  updatedText?: string;
  sourceText?: string;
}

export interface ApiResponse {
  data: {
    items?: any[];
  };
}
