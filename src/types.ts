/**
 * Types used for the DIYMate project
 */

/**
 * HTMLElementEvent type for html event typing and to prevent null erros
 */
export type HTMLElementEvent<T extends HTMLElement> = Event & { target:T};


/**
 * Generic wrapper type for constructors, used in the DI system.
 */
export type Constructor<T> = {
    new (...args: any[]): T;
  };