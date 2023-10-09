import {UnionToIntersection} from 'type-fest';

type IsFieldAccessorFnName<
  TKey,
  TObject,
  TAccessorName extends string,
> = TKey extends `${TAccessorName}${infer TObjectProp}`
  ? Lowercase<TObjectProp> extends keyof TObject
    ? true
    : false
  : false;

type AccessorGetFnName = 'get';
type AccessorSetFnName = 'set';
type AccessorAssertGetFnName = 'assertGet';
type AccessorCloneFnName = 'clone';
type AccessorToObjectFnName = 'toObject';
type ToAccessorGetFnName<TKey extends string> = `get${Capitalize<TKey>}`;
type ToAccessorSetFnName<TKey extends string> = `set${Capitalize<TKey>}`;
type ToAccessorAssertGetFnName<TKey extends string> =
  `assertGet${Capitalize<TKey>}`;

type IsAccessorGetFnName<TKey extends string, TObject> = IsFieldAccessorFnName<
  TKey,
  TObject,
  AccessorGetFnName
>;

type IsAccessorSetFnName<TKey extends string, TObject> = IsFieldAccessorFnName<
  TKey,
  TObject,
  AccessorSetFnName
>;

type IsAccessorAssertGetFnName<
  TKey extends string,
  TObject,
> = IsFieldAccessorFnName<TKey, TObject, AccessorAssertGetFnName>;

type IsAccessorFnName<
  TKey extends string,
  TObject,
> = TKey extends AccessorCloneFnName
  ? true
  : TKey extends AccessorToObjectFnName
  ? true
  : IsAccessorGetFnName<TKey, TObject> extends true
  ? true
  : IsAccessorSetFnName<TKey, TObject> extends true
  ? true
  : IsAccessorAssertGetFnName<TKey, TObject> extends true
  ? true
  : false;

type GetAccessor<TValue> = () => TValue | undefined;
type SetAccessor<TValue, TObject> = (
  value: TValue | undefined
) => WithAccessors<TObject>;
type AssertGetAccessor<TValue> = () => TValue;
type CloneAccessor<TObject> = () => WithAccessors<TObject>;
type ToObjectAccessor<TObject> = () => TObject;

type UnresolvedTargetEntry<
  TOriginalKey,
  TFinalKey,
  TOriginalValue,
  TIsAccessorField extends boolean,
  TFinalValue,
> = [TOriginalKey, TFinalKey, TOriginalValue, TIsAccessorField, TFinalValue];

type ResolvedTargetEntry<TFinalKey, TValue> = [TFinalKey, TValue];

type UnresolvedTargetEntriesFromField<
  TObject,
  TKey extends keyof TObject,
> = TKey extends string
  ? IsAccessorFnName<TKey, TObject> extends false
    ?
        | UnresolvedTargetEntry<
            TKey,
            ToAccessorGetFnName<TKey>,
            TObject[TKey],
            true,
            GetAccessor<TObject[TKey]>
          >
        | UnresolvedTargetEntry<
            TKey,
            ToAccessorSetFnName<TKey>,
            TObject[TKey],
            true,
            SetAccessor<TObject[TKey], TObject>
          >
        | UnresolvedTargetEntry<
            TKey,
            ToAccessorAssertGetFnName<TKey>,
            TObject[TKey],
            true,
            AssertGetAccessor<TObject[TKey]>
          >
    : UnresolvedTargetEntry<TKey, TKey, TObject[TKey], false, TObject[TKey]>
  : UnresolvedTargetEntry<TKey, TKey, TObject[TKey], false, TObject[TKey]>;

type UnresolvedTargetEntriesFromTarget<TObject> =
  | {
      [TKey in keyof TObject]: UnresolvedTargetEntriesFromField<TObject, TKey>;
    }[keyof TObject]
  | (AccessorCloneFnName extends keyof TObject
      ? UnresolvedTargetEntry<
          AccessorCloneFnName,
          AccessorCloneFnName,
          TObject[AccessorCloneFnName],
          false,
          TObject[AccessorCloneFnName]
        >
      : UnresolvedTargetEntry<
          AccessorCloneFnName,
          AccessorCloneFnName,
          CloneAccessor<TObject>,
          true,
          CloneAccessor<TObject>
        >)
  | (AccessorToObjectFnName extends keyof TObject
      ? UnresolvedTargetEntry<
          AccessorToObjectFnName,
          AccessorToObjectFnName,
          TObject[AccessorToObjectFnName],
          false,
          TObject[AccessorToObjectFnName]
        >
      : UnresolvedTargetEntry<
          AccessorToObjectFnName,
          AccessorToObjectFnName,
          ToObjectAccessor<TObject>,
          true,
          ToObjectAccessor<TObject>
        >);

type ResolveTargetEntriesFromUnresolvedEntries<
  TUnresolvedEntry extends UnresolvedTargetEntry<any, any, any, any, any>,
  TOmitOriginalKeys = never,
  TOmitValues = never,
> = TUnresolvedEntry extends UnresolvedTargetEntry<
  infer TOriginalKey,
  infer TFinalKey,
  infer TValue,
  infer TIsAccessorField,
  infer TFinalValue
>
  ? TIsAccessorField extends true
    ? TOriginalKey extends TOmitOriginalKeys
      ? ResolvedTargetEntry<TOriginalKey, TFinalValue>
      : TValue extends TOmitValues
      ? ResolvedTargetEntry<TOriginalKey, TFinalValue>
      : ResolvedTargetEntry<TFinalKey, TFinalValue>
    : ResolvedTargetEntry<TOriginalKey, TFinalValue>
  : {};

type ResolvedTargetEntryToFinalTarget<TResolvedEntry> =
  TResolvedEntry extends ResolvedTargetEntry<infer TKey, infer TValue>
    ? TKey extends keyof any
      ? Record<TKey, TValue>
      : {}
    : {};

export type WithAccessors<
  TObject,
  TOmitOriginalKeys = never,
  TOmitValues = (...args: any) => any,
> = TObject &
  UnionToIntersection<
    ResolvedTargetEntryToFinalTarget<
      ResolveTargetEntriesFromUnresolvedEntries<
        UnresolvedTargetEntriesFromTarget<TObject>,
        TOmitOriginalKeys,
        TOmitValues
      >
    >
  >;
