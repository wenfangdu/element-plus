import { nextTick } from 'vue'
import Select from '../src/select.vue'
import { makeMountFunc } from '@element-plus/test-utils/make-mount'
import { NOOP } from '@vue/shared'

jest.useFakeTimers()

const _mount = makeMountFunc({
  components: {
    'el-select': Select,
  },
})

const createData = (count = 1000) => {
  const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  return Array.from({ length: count }).map((_, idx) => ({
    value: `option_${idx + 1}`,
    label: `${initials[idx % 10]}${idx}`,
  }))
}

interface SelectProps {
  popperClass?: string
  value?: string | string[]
  options?: any[]
  disabled?: boolean
  clearable?: boolean
  multiple?: boolean
  filterable?: boolean
  multipleLimit?: number
  [key: string]: any
}

interface SelectEvents {
  onChange?: (value?: string) => void
  onVisibleChange?: (visible?: boolean) => void
  onRemoveTag?: (tag?: string) => void
  onFocus?: (event?: FocusEvent) => void
  onBlur?: (event?) => void
  [key: string]: (...args) => any
}

const createSelect = (options: {
  data?: () => SelectProps
  methods?: SelectEvents
} = {}) => {
  return _mount(`
      <el-select
        :options="options"
        :popper-class="popperClass"
        :disabled="disabled"
        :clearable="clearable"
        :multiple="multiple"
        :filterable="filterable"
        :multiple-limit="multipleLimit"
        @change="onChange"
        @visible-change="onVisibleChange"
        @remove-tah="onRemoveTag"
        @focus="onFocus"
        @blur="onBlur"
        v-model="value"></el-select>
    `, {
    data () {
      return {
        options: createData(),
        value: '',
        popperClass: '',
        disabled: false,
        clearable: false,
        multiple: false,
        filterable: false,
        multipleLimit: 0,
        ...options.data && options.data(),
      }
    },
    methods: {
      onChange: NOOP,
      onVisibleChange: NOOP,
      onRemoveTag: NOOP,
      onFocus: NOOP,
      onBlur: NOOP,
      ...options.methods,
    },
  })
}

function getOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(
    `body > div:last-child .${OPTION_ITEM_CLASS_NAME}`,
  ))
}

const CLASS_NAME = 'el-select-v2'
const WRAPPER_CLASS_NAME = 'el-select-v2__wrapper'
const OPTION_ITEM_CLASS_NAME = 'el-select-dropdown__option-item'
const PLACEHOLDER_CLASS_NAME = 'el-select-v2__placeholder'
const DEFAULT_PLACEHOLDER = 'Select'

describe('Select', () => {

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('create', async () => {
    const wrapper = createSelect()
    await nextTick
    expect(wrapper.classes()).toContain(CLASS_NAME)
    expect(wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`).text()).toContain(DEFAULT_PLACEHOLDER)
    const select = wrapper.findComponent(Select)
    await wrapper.trigger('click')
    expect((select.vm as any).expanded).toBeTruthy()
  })

  it('options rendered correctly', async() => {
    const wrapper = createSelect()
    await nextTick
    const vm = wrapper.vm as any
    const options = document.getElementsByClassName(OPTION_ITEM_CLASS_NAME)
    const result = [].every.call(options, (option, index) => {
      const text = option.textContent
      return text === vm.options[index].label
    })
    expect(result).toBeTruthy()
  })

  it('custom dropdown class', async() => {
    createSelect({
      data: () => ({
        popperClass: 'custom-dropdown',
      }),
    })
    await nextTick
    expect(document.querySelector('.el-popper').classList).toContain('custom-dropdown')
  })

  it('default value', async () => {
    const wrapper = createSelect({
      data: () => ({
        value: '2',
        options: [
          {
            value: '1',
            label: 'option_a',
          },
          {
            value: '2',
            label: 'option_b',
          },
          {
            value: '3',
            label: 'option_c',
          },
        ],
      }),
    })
    const vm = wrapper.vm as any
    await nextTick
    expect(wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`).text()).toBe(vm.options[1].label)
  })

  it('default value is null or undefined', async () => {
    const wrapper = createSelect()
    const vm = wrapper.vm as any
    const placeholder = wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`)
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
    vm.value = vm.options[2].value
    await nextTick
    expect(placeholder.text()).toBe(vm.options[2].label)
    vm.value = null
    await nextTick
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
  })

  it('sync set value and options', async () => {
    const wrapper = createSelect()
    await nextTick
    const placeholder = wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`)
    const vm = wrapper.vm as any
    vm.value = vm.options[1].value
    await nextTick
    expect(placeholder.text()).toBe(vm.options[1].label)
    vm.options[1].label = 'option bb aa'
    await nextTick
    expect(placeholder.text()).toBe('option bb aa')
  })

  it('single select', async () => {
    const wrapper = createSelect({
      data() {
        return {
          count: 0,
        }
      },
      methods: {
        onChange() {
          this.count++
        },
      },
    })
    await nextTick
    const options = getOptions()
    const vm = wrapper.vm as any
    const placeholder = wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`)
    expect(vm.value).toBe('')
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
    options[2].click()
    await nextTick
    expect(vm.value).toBe(vm.options[2].value)
    expect(placeholder.text()).toBe(vm.options[2].label)
    options[4].click()
    await nextTick
    expect(vm.value).toBe(vm.options[4].value)
    expect(placeholder.text()).toBe(vm.options[4].label)
    expect(vm.count).toBe(2)
  })

  it('disabled option', async () => {
    const wrapper = createSelect({
      data: () => {
        return {
          options: [
            {
              value: '1',
              label: 'option 1',
              disabled: false,
            },
            {
              value: '2',
              label: 'option 2',
              disabled: true,
            },
            {
              value: '3',
              label: 'option 3',
              disabled: false,
            },
          ],
        }
      },
    })
    await nextTick
    const vm = wrapper.vm as any
    const placeholder = wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`)
    const option = document.querySelector<HTMLElement>(`.el-select-dropdown__option-item.is-disabled`)
    expect(option.textContent).toBe(vm.options[1].label)
    option.click()
    await nextTick
    expect(vm.value).toBe('')
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
    vm.options[2].disabled = true
    await nextTick
    const options = document.querySelectorAll<HTMLElement>(`.el-select-dropdown__option-item.is-disabled`)
    expect(options.length).toBe(2)
    expect(options.item(1).textContent).toBe(vm.options[2].label)
    options.item(1).click()
    await nextTick
    expect(vm.value).toBe('')
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
  })

  it('disabled select', async () => {
    const wrapper = createSelect({
      data: () => {
        return {
          disabled: true,
        }
      },
    })
    await nextTick
    expect(wrapper.find(`.${WRAPPER_CLASS_NAME}`).classes()).toContain('is-disabled')
  })

  it('visible event', async () => {
    const wrapper = createSelect({
      data: () => {
        return {
          visible: false,
        }
      },
      methods: {
        onVisibleChange(visible) {
          this.visible = visible
        },
      },
    })
    await nextTick
    const vm = wrapper.vm as any
    await wrapper.trigger('click')
    expect(vm.visible).toBeTruthy()
  })

  it('clearable', async () => {
    const wrapper = createSelect({
      data: () => ({ clearable: true }),
    })
    const vm = wrapper.vm as any
    vm.value = vm.options[1].value
    await nextTick
    const select = wrapper.findComponent(Select)
    const selectVm = select.vm as any
    selectVm.states.comboBoxHovering = true
    await nextTick
    const clearBtn = wrapper.find(`.${selectVm.clearIcon}`)
    expect(clearBtn.exists()).toBeTruthy()
    await clearBtn.trigger('click')
    expect(vm.value).toBe('')
    const placeholder = wrapper.find(`.${PLACEHOLDER_CLASS_NAME}`)
    expect(placeholder.text()).toBe(DEFAULT_PLACEHOLDER)
  })

  describe('multiple', () => {

    it('multiple select', async () => {
      const wrapper = createSelect({
        data: () => {
          return {
            multiple: true,
            value: [],
          }
        },
      })
      await nextTick
      const vm = wrapper.vm as any
      const options = getOptions()
      options[1].click()
      await nextTick
      expect(vm.value.length).toBe(1)
      expect(vm.value[0]).toBe(vm.options[1].value)
      options[3].click()
      await nextTick
      expect(vm.value.length).toBe(2)
      expect(vm.value[1]).toBe(vm.options[3].value)
      const tagIcon = wrapper.find('.el-tag__close')
      await tagIcon.trigger('click')
      expect(vm.value.length).toBe(1)
    })

    it('remove-tag', async () => {
      const wrapper = createSelect({
        data() {
          return {
            removeTag: '',
            multiple: true,
          }
        },
        methods: {
          onRemoveTag(tag) {
            this.removeTag = tag
          },
        },
      })
      await nextTick
      const vm = wrapper.vm as any
      const options = getOptions()
      options[0].click()
      await nextTick()
      options[1].click()
      await nextTick()
      options[2].click()
      await nextTick()
      expect(vm.value.length).toBe(3)
      const tagCloseIcons = wrapper.findAll('.el-tag__close')
      await tagCloseIcons[1].trigger('click')
      expect(vm.value.length).toBe(2)
      await tagCloseIcons[0].trigger('click')
      expect(vm.value.length).toBe(1)
    })

    it('limit', async () => {
      const wrapper = createSelect({
        data() {
          return {
            multiple: true,
            multipleLimit: 2,
            value: [],
          }
        },
      })
      await nextTick
      const vm = wrapper.vm as any
      const options = getOptions()
      options[1].click()
      await nextTick
      options[2].click()
      await nextTick
      expect(vm.value.length).toBe(2)
      options[3].click()
      await nextTick
      expect(vm.value.length).toBe(2)
    })
  })

  describe('event', () => {

    it('focus & blur', async () => {
      const onFocus = jest.fn()
      const onBlur = jest.fn()
      const wrapper = createSelect({
        methods: {
          onFocus,
          onBlur,
        },
      })
      const input = wrapper.find('input')
      const select = wrapper.findComponent(Select)
      await input.trigger('focus')
      // Simulate focus state to trigger menu multiple times
      select.vm.toggleMenu()
      await nextTick
      select.vm.toggleMenu()
      await nextTick
      // Simulate click the outside
      select.vm.handleClickOutside()
      await nextTick
      expect(onFocus).toHaveBeenCalledTimes(1)
      expect(onBlur).toHaveBeenCalled()
    })

    it('focus & blur for multiple & filterable select', async () => {
      const onFocus = jest.fn()
      const onBlur = jest.fn()
      const wrapper = createSelect({
        data() {
          return {
            multiple: true,
            filterable: true,
            value: [],
          }
        },
        methods: {
          onFocus,
          onBlur,
        },
      })
      const input = wrapper.find('input')
      const select = wrapper.findComponent(Select)
      await input.trigger('focus')
      // Simulate focus state to trigger menu multiple times
      select.vm.toggleMenu()
      await nextTick
      select.vm.toggleMenu()
      await nextTick
      // Select multiple items in multiple mode without triggering focus
      const options = getOptions()
      options[1].click()
      await nextTick
      options[2].click()
      await nextTick
      expect(onFocus).toHaveBeenCalledTimes(1)
      // Simulate click the outside
      select.vm.handleClickOutside()
      await nextTick
      await nextTick
      expect(onBlur).toHaveBeenCalled()
    })
  })
})
