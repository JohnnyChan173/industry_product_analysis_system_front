export type Recordable<T = any> = Record<string, T>;

export type Signable<T = any> = T & {
  [key: string]: any;
};

export type Nullable<T = any> = T | null;

export type TimeoutHandle = ReturnType<typeof setTimeout>;

export type IntervalHandle = ReturnType<typeof setInterval>;
