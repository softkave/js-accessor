import {AssertionError} from 'assert';
import {capitalize, flattenDeep, noop} from 'lodash';
import {construct, kAccessorFieldPrefixKeys, kAccessorKeys} from '../index.js';

describe('construct', () => {
  test('accessor fields present', () => {
    const constructed = construct<TestData>();
    kTestDataAccessors.forEach(key =>
      expect(
        typeof constructed[key as unknown as keyof typeof constructed]
      ).toBe('function')
    );
  });

  test('original field values returned', () => {
    const original = generateTestData();
    const constructed = construct<TestData>(original);
    kTestDataKeys.forEach(key => expect(constructed[key]).toBe(original[key]));
  });

  test('original field with accessor names values not overridden', () => {
    const original = generateTestData();
    const constructed = construct<TestData>(original);
    expect(constructed.getData).toBe(original.getData);
    expect(constructed.setData).toBe(original.setData);
    expect(constructed.assertGetData).toBe(original.assertGetData);
  });

  test('get accessor', () => {
    const constructed = construct<TestData>({first: 1});
    expect(constructed.getFirst()).toBe(1);
  });

  test('set accessor', () => {
    const constructed = construct<TestData>();
    constructed.setFirst(1);
    expect(constructed.first).toBe(1);
    expect(constructed.getFirst()).toBe(1);
    constructed.setFirst(undefined);
    expect(constructed.getFirst()).toBe(undefined);
  });

  test('set accessor where target has a def', () => {
    const constructed = construct<TestData>();
    constructed.setFirst(1);
    expect(constructed.first).toBe(1);
    expect(constructed.getFirst()).toBe(1);
    constructed.setFirst(undefined);
    expect(constructed.getFirst()).toBe(undefined);
  });

  test('assertGet accessor', () => {
    const constructed = construct<TestData>({first: 1});
    expect(constructed.assertGetFirst()).toBe(1);
    expect(() => constructed.assertGetSecond()).toThrowError(AssertionError);
  });

  test('clone accessor', () => {
    const constructed = construct<TestData>({first: 1});
    const constructed02 = constructed.clone();
    expect(constructed02.getFirst()).toBe(1);
    constructed02.setFirst(2);
    expect(constructed02.getFirst()).toBe(2);
    expect(constructed.getFirst()).toBe(1);
  });

  test('toObject accessor', () => {
    const initial = generateTestData();
    const constructed = construct<TestData>(initial);
    expect(constructed.toObject()).toMatchObject(initial);
  });

  test('options valueGetter', () => {
    const initial = generateTestData();
    const constructed = construct<TestData>(initial, {
      getter() {
        return 3;
      },
    });
    expect(constructed.getFirst()).toBe(3);
  });

  test('options valueSetter', () => {
    const initial = generateTestData();
    const constructed = construct<TestData>(initial, {
      setter(target, p) {
        const prop = p as unknown as keyof TestData;
        const permissiveTarget = target as Record<string, unknown>;
        permissiveTarget[prop] = 5;
      },
    });
    constructed.setFirst(4);
    expect(constructed.getFirst()).toBe(5);
  });

  test('options cloneResolver', () => {
    const initial = generateTestData();
    const constructed = construct<TestData>(initial, {
      cloneResolver() {
        return construct<TestData>({first: 2});
      },
    });
    const clone = constructed.clone();
    expect(clone.getFirst()).toBe(2);
    expect(constructed.getFirst()).toBe(initial.first);
  });

  test('options toObjectResolver', () => {
    const initial = generateTestData();
    const constructed = construct<TestData>(initial, {
      toObjectResolver() {
        return {first: 5};
      },
    });
    const obj = constructed.toObject();
    expect(obj).toMatchObject({first: 5});
  });

  test('default toObject', () => {
    type TestData = {
      first: number;
      toObject: (p1: number) => TestData;
    };

    const toObject = jest.fn().mockReturnValue({first: 1});
    const constructed = construct<TestData>({first: 1, toObject});
    expect(constructed.toObject(0)).toMatchObject({first: 1});
    expect(toObject).toHaveBeenCalledWith(0);
  });
});

interface TestData {
  first: number;
  second: 2;
  word: string;
  getData: string;
  setData: string;
  assertGetData: string;
  func: () => void;
}

function toFieldAccessorNames(keys: string[]) {
  return flattenDeep(
    Object.values(keys).map(nextKey =>
      Object.values(kAccessorFieldPrefixKeys).map(
        accessorPrefix => `${accessorPrefix}${capitalize(nextKey)}`
      )
    )
  );
}

const kTestDataKeys: Array<keyof TestData> = [
  'first',
  'second',
  'word',
  'func',
  'getData',
  'setData',
  'assertGetData',
];
const kTestDataNonFuncKeys: Array<keyof TestData> = ['first', 'second', 'word'];
const kTestDataAccessors = toFieldAccessorNames(kTestDataNonFuncKeys).concat(
  Object.values(kAccessorKeys)
);

function generateTestData(): TestData {
  return {
    first: 1,
    second: 2,
    word: 'word',
    getData: 'getData',
    setData: 'setData',
    assertGetData: 'assertGetData',
    func: noop,
  };
}
