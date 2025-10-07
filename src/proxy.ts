import assert = require('assert');
import {camelCase, get, isFunction, isString, merge, set} from 'lodash';
import {WithAccessors} from './types.js';

export const kAccessorFieldPrefixKeys = {
  get: 'get',
  set: 'set',
  assertGet: 'assertGet',
} as const;

export const kAccessorAugmentFnKeys = {
  clone: 'clone',
  toObject: 'toObject',
} as const;

export const kAccessorKeys = {
  ...kAccessorFieldPrefixKeys,
  ...kAccessorAugmentFnKeys,
} as const;

export interface AccessorProxyOptions<T extends object> {
  getter?: (
    target: Partial<T>,
    field: string,
    originalField: string,
    params: unknown[]
  ) => unknown;
  setter?: (
    target: Partial<T>,
    field: string,
    value: unknown,
    originalField: string,
    params: unknown[]
  ) => void;
  cloneResolver?: (target: Partial<T>, params: unknown[]) => WithAccessors<T>;
  toObjectResolver?: (target: Partial<T>, params: unknown[]) => Partial<T>;
}

const defaultGetter: Required<AccessorProxyOptions<object>>['getter'] = (
  target,
  field,
  originalField,
  params
) => {
  const getter = Reflect.get(target, originalField);
  return isFunction(getter) ? getter(...params) : get(target, field);
};

const defaultSetter: Required<AccessorProxyOptions<object>>['setter'] = (
  target,
  field,
  value,
  originalField,
  params
) => {
  const setter = Reflect.get(target, originalField);
  return isFunction(setter) ? setter(...params) : set(target, field, value);
};

const defaultCloneResolver: Required<
  AccessorProxyOptions<object>
>['cloneResolver'] = (target, params) => {
  const resolver = Reflect.get(target, kAccessorAugmentFnKeys.clone);
  return isFunction(resolver)
    ? resolver(...params)
    : construct(merge({}, target));
};

const defaultToObjectResolver: Required<
  AccessorProxyOptions<object>
>['toObjectResolver'] = (target, params) => {
  const resolver = Reflect.get(target, kAccessorAugmentFnKeys.clone);
  return isFunction(resolver) ? resolver(...params) : target;
};

export function construct<T extends object>(
  target: Partial<T> = {},
  options: AccessorProxyOptions<T> = {}
) {
  const {
    getter = defaultGetter,
    setter = defaultSetter,
    cloneResolver = defaultCloneResolver,
    toObjectResolver = defaultToObjectResolver,
  } = options;

  return new Proxy(target, {
    get(proxyTarget, originalField, receiver) {
      if (isString(originalField) && !Reflect.has(proxyTarget, originalField)) {
        if (originalField.startsWith(kAccessorKeys.get)) {
          const field = camelCase(
            originalField.slice(kAccessorKeys.get.length)
          );
          return (...params: unknown[]) => {
            return getter(proxyTarget, field, originalField, params);
          };
        } else if (
          originalField.startsWith(kAccessorKeys.assertGet) &&
          !Reflect.has(proxyTarget, originalField)
        ) {
          const field = camelCase(
            originalField.slice(kAccessorKeys.assertGet.length)
          );
          return (...params: unknown[]) => {
            const value = getter(proxyTarget, field, originalField, params);
            assert(value);
            return value;
          };
        } else if (
          originalField.startsWith(kAccessorKeys.set) &&
          !Reflect.has(proxyTarget, originalField)
        ) {
          const field = camelCase(
            originalField.slice(kAccessorKeys.set.length)
          );
          return (value: unknown, ...otherParams: unknown[]) => {
            setter(proxyTarget, field, value, originalField, [
              value,
              ...otherParams,
            ]);
            return receiver;
          };
        } else if (originalField.startsWith(kAccessorKeys.clone)) {
          return (...params: unknown[]) => {
            return cloneResolver(proxyTarget, params);
          };
        } else if (originalField.startsWith(kAccessorKeys.toObject)) {
          return (...params: unknown[]) =>
            toObjectResolver(proxyTarget, params);
        }
      }

      return Reflect.get(target, originalField, receiver);
    },
  }) as unknown as WithAccessors<T>;
}
