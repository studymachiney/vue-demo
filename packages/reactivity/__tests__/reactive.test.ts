// import { isReactive, reactive, toRaw } from '../src/reactive'

import { isReactive, reactive, toRaw } from "../src/reactive"

describe('reactivity/reactive', () => {
    //step1
    test('Object', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        // get
        expect(observed.foo).toBe(1)
        // has
        expect('foo' in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(['foo'])
    })

 

    test('proto', () => {
        const obj = {}
        const reactiveObj = reactive(obj)
        expect(isReactive(reactiveObj)).toBe(true)
        // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
        // @ts-ignore
        const prototype = reactiveObj['__proto__']
        const otherObj = { data: ['a'] }
        expect(isReactive(otherObj)).toBe(false)
        const reactiveOther = reactive(otherObj)
        expect(isReactive(reactiveOther)).toBe(true)
        expect(reactiveOther.data[0]).toBe('a')
    })
    test('observed value should proxy mutations to original (Object)', () => {
      const original: any = { foo: 1 }
      const observed = reactive(original)
      // set
      observed.bar = 1
      expect(observed.bar).toBe(1)
      expect(original.bar).toBe(1)
      // delete
      delete observed.foo
      expect('foo' in observed).toBe(false)
      expect('foo' in original).toBe(false)
  })

    //step2
    test('nested reactives', () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [{ bar: 2 }]
        }
        const observed = reactive(original)
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    })

    //step3
    test('observing already observed value should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(observed)
        expect(observed2).toBe(observed)
      })
    
      test('observing the same value multiple times should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(original)
        expect(observed2).toBe(observed)
      })


      //step4
      test('should not pollute original object with Proxies', () => {
        const original: any = { foo: 1 }
        const original2 = { bar: 2 }
        const observed = reactive(original)
        const observed2 = reactive(original2)
        observed.bar = observed2
        expect(observed.bar).toBe(observed2)
        expect(original.bar).toBe(original2)
      })

      test('toRaw', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(toRaw(observed)).toBe(original)
        expect(toRaw(original)).toBe(original)
      })

      //step5
      test('should not observe non-extensible objects', () => {
        const obj = reactive({
          foo: Object.preventExtensions({ a: 1 }),
          // sealed or frozen objects are considered non-extensible as well
          bar: Object.freeze({ a: 1 }),
          baz: Object.seal({ a: 1 })
        })
        expect(isReactive(obj.foo)).toBe(false)
        expect(isReactive(obj.bar)).toBe(false)
        expect(isReactive(obj.baz)).toBe(false)
      })
})
