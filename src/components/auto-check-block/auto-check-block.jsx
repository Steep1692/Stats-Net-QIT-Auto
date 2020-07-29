import React, { useState, useEffect } from 'react'
import * as styles from './auto-check-block.module.css'
import { lang } from '../../assets/lang'
import { api } from '../../services/api'
import AutoOwnerInfo from '../auto-owner-info/auto-owner-info'
import BaseModal from '../base-modal/base-modal'
import BaseButton from '../base-button/base-button'
import BaseInput from '../base-input/base-input'
import BaseSpacing from '../base-spacing/base-spacing'
import BaseCheckpoint from '../base-checkpoint/base-checkpoint'
import BaseCamera from '../base-camera/base-camera'

const AutoCheckBlock = () => {
  const userPhotoDefaultValue = ''
  const uuserPhoneNumberDefaultValue = ''
  const ownerInfoDefaultValue = null
  const fetchErrorDefaultValue = ''
  const isModalLoadsDefaultValue = ''
  const igosOrVinNumberValueDefaultValue = ''

  const [gosOrVinNumberValue, setGosOrVinNumberValue] = useState(igosOrVinNumberValueDefaultValue)
  const [userPhoto, setUserPhoto] = useState(userPhotoDefaultValue)
  const [userPhoneNumber, setUserPhoneNumber] = useState(uuserPhoneNumberDefaultValue)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoads, setIsModalLoads] = useState(isModalLoadsDefaultValue)
  const [isStartCheckingLoads, setIsStartCheckingLoads] = useState(false)
  const [fetchError, setFetchError] = useState(fetchErrorDefaultValue)
  const [ownerInfo, setOwnerInfo] = useState(ownerInfoDefaultValue)

  const fetchOwnerInfo = () => {
    return api.getOwnerInfo(gosOrVinNumberValue)
      .then((data) => {
        setOwnerInfo(data)
      })
  }

  const fetchStartChecking = () => {
    return api.startChecking()
      .then((data) => {
        setOwnerInfo(data)
      })
  }

  const onGosOrVinNumberInputChange = ({ nativeEvent }) => {
    setGosOrVinNumberValue(nativeEvent.target.value)
  }
  const onInputPhoneNumberChange = ({ nativeEvent }) => {
    setUserPhoneNumber(nativeEvent.target.value)
  }
  const onFormOwnerinfoSubmit = (e) => {
    e.preventDefault()

    setIsModalOpen(true)
    setIsModalLoads(true)

    fetchOwnerInfo()
      .catch(() => {
        setFetchError('Произошла ошибка. Проверьте данные на достоверность!')
      })
      .then(() => {
        setGosOrVinNumberValue(igosOrVinNumberValueDefaultValue)
      })
      .finally(() => {
        setIsModalLoads(false)
      })
  }
  const onButtonCloseClick = () => {
    setIsModalOpen(false)
  }
  const onPhotoCapture = (base64Img) => {
    setUserPhoto(base64Img)
  }
  const onUserPhotoClick = () => {
    setUserPhoto('')
  }
  const onFormCheckSubmit = (e) => {
    e.preventDefault()

    setIsStartCheckingLoads(true)
    fetchStartChecking()
      .finally(() => {
        setIsStartCheckingLoads(false)
      })
  }

  const resetData = () => {
    setUserPhoto(userPhotoDefaultValue)
    setUserPhoneNumber(uuserPhoneNumberDefaultValue)
    setFetchError(fetchErrorDefaultValue)
    setOwnerInfo(ownerInfoDefaultValue)
    setIsModalLoads(isModalLoadsDefaultValue)
  }

  useEffect(() => {
    if (!isModalOpen) {
      resetData()
    }
  }, [isModalOpen])

  return (
    <>
      <div className="rightHead">
        <h1 className="VinCheckSnippet__title">История автомобиля</h1>
        <div className="VinCheckSnippet__description">Узнайте правду об автомобиле перед покупкой по госномеру или VIN.</div>
        <div className="VinCheckSnippet__inputContainer">
          <form
            onSubmit={onFormOwnerinfoSubmit}
            className="ControlGroup ControlGroup_responsive_no ControlGroup_size_xl ControlGroup_width_full"
          >
            <label className="TextInput TextInput_size_xl TextInput_has-clear TextInput_has-placeholder TextInput_placeholderShowWithValue">
              <div className="TextInput__input">
                <span className="TextInput__box">
                  <div className="TextInput__placeholder">Госномер или VIN</div>
                  <input
                    className="TextInput__control"
                    value={gosOrVinNumberValue}
                    required
                    type="text"
                    onChange={onGosOrVinNumberInputChange}
                  />
                  <i className="TextInput__clear"></i>
                </span>
              </div>
              <span className="TextInput__error"></span>
            </label>
            <button
              type="submit"
              className="Button Button_color_blue Button_size_xl Button_type_button Button_width_default VinCheckSnippet__button"
            >
              <span className="Button__content"><span className="Button__text">Найти</span></span>
            </button>
          </form>
        </div>
      </div>

      <BaseModal loads={isModalLoads} open={isModalOpen} onButtonCloseClick={onButtonCloseClick}>

        {
          (ownerInfo) ? (
            <div>
              <div className={styles.modalTopRow}>
                <div className={styles.ownerInfo}>
                  <AutoOwnerInfo infoObject={ownerInfo} />
                </div>

                <div className={styles.photoCamera}>

                  {
                    (userPhoto) ? (
                      <img src={userPhoto} onClick={onUserPhotoClick} alt="User photo" />
                    ) : <BaseCamera onCapture={onPhotoCapture} />
                  }

                </div>
              </div>

              <BaseSpacing size={2} />

              <div>
                <form onSubmit={onFormCheckSubmit} className={styles.scoringForm}>

                  <h2>Начать проверку</h2>

                  <BaseSpacing size={2} />

                  <BaseInput
                    value={userPhoneNumber}
                    onChange={onInputPhoneNumberChange}
                    required type="tel"
                    placeholder="Телефон"
                  />

                  <BaseSpacing size={1} />

                  <BaseCheckpoint completed={userPhoto} >Фотография сделана</BaseCheckpoint>

                  <BaseSpacing size={1} />

                  <BaseButton loads={isStartCheckingLoads} type="submit">Начать скоринг</BaseButton>

                </form>
              </div>

            </div>
          ) : <div className={styles.popupMessage}>{fetchError || lang.common.nodata} </div>
        }


      </BaseModal>
    </>
  )
}

export default AutoCheckBlock