import { format } from 'sql-formatter'

// SQL pretty-printer (sql-formatter). The dialect type is derived from the
// library's own options so the list can't drift out of sync with what it
// accepts. format() throws on input it can't tokenize; the UI catches it.

type FormatOptions = NonNullable<Parameters<typeof format>[1]>
export type Dialect = NonNullable<FormatOptions['language']>

export const SQL_DIALECTS: Dialect[] = [
  'sql',
  'postgresql',
  'mysql',
  'mariadb',
  'sqlite',
  'bigquery',
  'snowflake',
  'redshift',
  'spark',
  'transactsql',
  'plsql',
  'trino',
]

export function formatSql(sql: string, dialect: Dialect): string {
  return format(sql, { language: dialect, keywordCase: 'upper' })
}
