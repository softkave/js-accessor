# js-accessor

## Overview

Provides accessors like `get`, `set`, `assertGet`, `clone`, and `toObject` for a JS object.

## Install

For `npm`

```sh
npm install js-accessor
```

For `yarn`

```sh
yarn add js-accessor
```

## Usage

```typescript
import {construct} from 'js-accessor';

interface DataType {
  resourceId: string;
  resourceType: string;
}

const data = construct<DataType>();
const resourceId = data
  .setResourceId('id')
  .setResourceType('data')
  .clone()
  .getResourceId();
```

## API

### `construct(target, options)`

Provides accessors for a target object, see below for accessors provided. Accessors will not be provided if a property with the accessor name already exists, allowing you to specify custom handling for certain properties. E.g. `target.getField` will not use the accessor flow if `getField` already exists in target. A known downside is set accessors, where you want to chain setters but can't. If this is a bummer, you can create a PR to address the issue or create an issue and I can look into it.

#### Parameters

- `target` - Optional, target object for accessor functions.
- `options.getter(target, field, originalField, params)` - Optional, Function for what a field's value.
  - `target` - Target object.
  - `field` - Field whose value is to be returned. It is `data` in `getData`.
  - `originalField` - Field with accessor prefix. It is `getData` in `getData`.
  - `params` - Array of arguments passed to the accessor function. It is `["some param"]` in `getData("some param")`.
  - returns `unknown` - field value.
- `options.setter(target, field, value)` - Optional, Function for customizing what a field name is resolved to.
  - `target` - Target object.
  - `field` - Field whose value is to be set. It is `data` in `setData`.
  - `originalField` - Field with accessor prefix. It is `setData` in `setData`.
  - `params` - Array of arguments passed to the accessor function. It is `["value", "some param"]` in `setData("value", "some param")`.
  - returns `void`
- `options.cloneResolver(target)` - Optional, Function for customizing what a field name is resolved to.
  - `target` - Target object.
  - `params` - Array of arguments passed to the accessor function. It is `["some param"]` in `clone("some param")`.
  - returns `object & WithAccessor<object>` - Should return target object cloned with accessors.
- `options.toObjectResolver(target)` - Optional, Function for customizing what a field name is resolved to.
  - `target` - Target object.
  - `params` - Array of arguments passed to the accessor function. It is `["some param"]` in `toObject("some param")`.
  - returns `object` - Should return cloned target object.

#### Returns

An object with accessor function described below.

## Accessors

- `get` - Getter function that retrieves the property indexed by the camel-cased name followed by `get`. For example, `getResourceId()` will return `resourceId`.
- `set` - Setter function for storing the property indexed by the camel-cased name followed by `set`. For example, `setResourceId("id")` will set `resourceId` to `id`, and `setResourceId(undefined)` will set it to `undefined`.
- `assertGet` - Getter function that retrieves and asserts the property indexed by the camel-cased name followed by `assertGet`. For example, `assertGetResourceId()` will return `resourceId` or throw an error if there is no `resourceId`.
- `clone` - Clone function that returns a copy of the data stored in an accessor's target, with accessor functions targeting the new copied target.
- `toObject` - Copy function that returns a JS object copy of the accessor's target.
