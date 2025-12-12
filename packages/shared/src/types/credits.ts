// Credits types

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description: string;
    referenceId?: string;
    referenceType?: string;
    balance: number;
    createdAt: Date;
}

export enum CreditTransactionType {
    PURCHASE = 'PURCHASE',
    USAGE = 'USAGE',
    REFUND = 'REFUND',
    BONUS = 'BONUS',
    SUBSCRIPTION = 'SUBSCRIPTION',
    ADJUSTMENT = 'ADJUSTMENT',
}

export interface CreditUsage {
    slides: number;
    images: number;
    charts: number;
    research: number;
    exports: number;
    total: number;
}

export interface CreditBalance {
    available: number;
    pending: number;
    used: number;
}

export interface CreditEstimate {
    slideCount: number;
    imageCount: number;
    chartCount: number;
    researchEnabled: boolean;
    exportFormat: string;
    estimatedCost: number;
    breakdown: CreditBreakdown;
}

export interface CreditBreakdown {
    slides: number;
    images: number;
    charts: number;
    research: number;
    export: number;
}

export interface PurchaseCreditInput {
    amount: number;
    paymentMethodId: string;
}

export interface CreditPlan {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    popular?: boolean;
    features: string[];
}
