import React from 'react'
import * as styles from './base-input.module.css'

const BaseInput = ({ className, loads, children, ...restProps  }) => (
  <input className={`${styles.input} ${className}`} { ...restProps }/>
)

export default BaseInput