export interface Result<T, E = Error> {
  readonly success: boolean;
  readonly value?: T;
  readonly error?: E;
}

export const Result = {
  ok<T>(value: T): Result<T> {
    return { success: true, value };
  },
  fail<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
  },
  isOk<T, E>(result: Result<T, E>): result is Result<T, E> & { value: T } {
    return result.success;
  },
  isFail<T, E>(result: Result<T, E>): result is Result<never, E> & { error: E } {
    return !result.success;
  },
};
