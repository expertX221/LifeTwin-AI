import {it,expect} from 'vitest'
import {checks} from './fixtures'
for(const [name,check] of checks)it(name,()=>expect(check()).toBe(true))
