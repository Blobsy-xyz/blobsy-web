/**
 * Represents a result that can either be a success containing a value of type `T`
 * or a failure containing an error of type `E`.
 *
 * This class provides utility methods to check and extract the result or error safely.
 */
abstract class Result<T, E> {
    abstract isFailure(): this is Failure<E>;
    abstract isSuccess(): this is Success<T>;
    abstract unwrap(): T;
    abstract unwrapOrNull(): T | null;
    abstract unwrapError(): E;
    abstract unwrapErrorOrNull(): E | null;
}

/**
 * Represents a successful result containing a value of type `T`.
 *
 * This class guarantees that a success will always have a valid value,
 * and attempting to access an error will result in an exception.
 */
class Success<T> extends Result<T, never> {
    constructor(public value: T) {
        super();
    }

    unwrap(): T {
        return this.value;
    }

    unwrapOrNull(): T {
        return this.value;
    }

    unwrapError(): never {
        throw new Error("Cannot unwrap success as error");
    }

    unwrapErrorOrNull(): null {
        return null;
    }

    isFailure(): this is Failure<never> {
        return false;
    }

    isSuccess(): this is Success<T> {
        return true;
    }
}

/**
 * Represents a failed result containing an error of type `E`.
 *
 * This class guarantees that a failure will always have a valid error,
 * and attempting to access a success value will result in an exception.
 */
class Failure<E> extends Result<never, E> {
    constructor(public error: E) {
        super();
    }

    unwrap(): never {
        throw this.error instanceof Error ? this.error : new Error(`Failure: ${String(this.error)}`);
    }

    unwrapOrNull(): null {
        return null;
    }

    unwrapError(): E {
        return this.error;
    }

    unwrapErrorOrNull(): E | null {
        return this.error;
    }

    isFailure(): this is Failure<E> {
        return true;
    }

    isSuccess(): this is Success<never> {
        return false;
    }
}

function success<T>(value: T): Result<T, never> {
    return new Success(value);
}

function failure<E>(error: E | string): Result<never, Error> {
    return new Failure(error instanceof Error ? error : new Error(String(error)));
}

export { Result, Success, Failure, success, failure };