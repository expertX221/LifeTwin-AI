import test from 'node:test'
import assert from 'node:assert/strict'
import {checks} from '../src/analytics/fixtures.ts'
for(const [name,check] of checks)test(name,()=>assert.equal(check(),true))
