export * from './Audio'
export * from './Project'
export * from './Settings'
export * from './API'

export type ID = string
export type Timestamp = Date

export interface BaseEntity {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface EntityWithName extends BaseEntity {
  name: string
}

export interface EntityWithDescription extends EntityWithName {
  description?: string
}

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray
export interface JSONObject {
  [key: string]: JSONValue
}
export type JSONArray = JSONValue[]