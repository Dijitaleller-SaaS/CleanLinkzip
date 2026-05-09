import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdminApproveVendorByName200, AdminExtendVendorByName200, AdminGetVendors200, ForbiddenResponse, HealthStatus, NotFoundResponse, UnauthorizedResponse } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns all vendor profiles including unpublished ones, with user info and subscription status.
 * @summary List all vendors (admin)
 */
export declare const getAdminGetVendorsUrl: () => string;
export declare const adminGetVendors: (options?: RequestInit) => Promise<AdminGetVendors200>;
export declare const getAdminGetVendorsQueryKey: () => readonly ["/api/admin/vendors"];
export declare const getAdminGetVendorsQueryOptions: <TData = Awaited<ReturnType<typeof adminGetVendors>>, TError = ErrorType<UnauthorizedResponse | ForbiddenResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetVendors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetVendors>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetVendorsQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetVendors>>>;
export type AdminGetVendorsQueryError = ErrorType<UnauthorizedResponse | ForbiddenResponse>;
/**
 * @summary List all vendors (admin)
 */
export declare function useAdminGetVendors<TData = Awaited<ReturnType<typeof adminGetVendors>>, TError = ErrorType<UnauthorizedResponse | ForbiddenResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetVendors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Approves a pending havale payment for the vendor with the given username. Sets isSubscribed, clears subscriptionPending, sets isSponsor based on havalePkg, and records yayinaGirisTarihi.
 * @summary Approve vendor subscription by name
 */
export declare const getAdminApproveVendorByNameUrl: (name: string) => string;
export declare const adminApproveVendorByName: (name: string, options?: RequestInit) => Promise<AdminApproveVendorByName200>;
export declare const getAdminApproveVendorByNameMutationOptions: <TError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminApproveVendorByName>>, TError, {
        name: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminApproveVendorByName>>, TError, {
    name: string;
}, TContext>;
export type AdminApproveVendorByNameMutationResult = NonNullable<Awaited<ReturnType<typeof adminApproveVendorByName>>>;
export type AdminApproveVendorByNameMutationError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>;
/**
 * @summary Approve vendor subscription by name
 */
export declare const useAdminApproveVendorByName: <TError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminApproveVendorByName>>, TError, {
        name: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminApproveVendorByName>>, TError, {
    name: string;
}, TContext>;
/**
 * Extends the vendor subscription by 30 days by resetting yayinaGirisTarihi to now.
 * @summary Extend vendor subscription by name
 */
export declare const getAdminExtendVendorByNameUrl: (name: string) => string;
export declare const adminExtendVendorByName: (name: string, options?: RequestInit) => Promise<AdminExtendVendorByName200>;
export declare const getAdminExtendVendorByNameMutationOptions: <TError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminExtendVendorByName>>, TError, {
        name: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminExtendVendorByName>>, TError, {
    name: string;
}, TContext>;
export type AdminExtendVendorByNameMutationResult = NonNullable<Awaited<ReturnType<typeof adminExtendVendorByName>>>;
export type AdminExtendVendorByNameMutationError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>;
/**
 * @summary Extend vendor subscription by name
 */
export declare const useAdminExtendVendorByName: <TError = ErrorType<UnauthorizedResponse | ForbiddenResponse | NotFoundResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminExtendVendorByName>>, TError, {
        name: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminExtendVendorByName>>, TError, {
    name: string;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map