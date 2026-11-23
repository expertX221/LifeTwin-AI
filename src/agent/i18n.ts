import i18next from 'i18next'
import {languages} from './engine'
export const ui=i18next.createInstance()
void ui.init({lng:'en',fallbackLng:'en',initImmediate:false,resources:Object.fromEntries(Object.entries(languages).map(([k,v])=>[k,{translation:v}]))})

