import React from 'react';
import { DuckCmpProps, purify } from 'saga-duck';
import Duck, { EDIT_TYPE, EDIT_TYPE_NAME, EDIT_TYPE_BTN_NAME } from './CreateDuck';
import Dialog from '@src/common/duckComponents/Dialog';
import { Bubble, Col, Form, Radio, Row, Tag, Text, RadioGroup } from 'tea-component';
import FormField from '@src/common/duckComponents/form/Field';
import Input from '@src/common/duckComponents/form/Input';
import CodeMirrorBox from '@src/common/components/CodeMirrorBox';
import { CONFIG_TYPE } from '../../types';
import TagConfig from './TagConfig';
import CodeMirrorDiff from '@src/common/components/CodeMirrorDiff';
import { nameTipMessage } from '@src/common/types';

export default function Create(props: DuckCmpProps<Duck>) {
  const { duck, store, dispatch } = props;
  const { selectors } = duck;
  const visible = selectors.visible(store);
  if (!visible) {
    return <noscript />;
  }
  const { editType, configVersion } = selectors.options(store);
  return (
    <Dialog
      duck={duck}
      store={store}
      dispatch={dispatch}
      size={800}
      title={`${EDIT_TYPE_NAME[editType]} ${
        editType !== EDIT_TYPE.create && editType !== EDIT_TYPE.generate && configVersion ? `(${configVersion})` : ''
      }`}
      defaultSubmitText={EDIT_TYPE_BTN_NAME[editType]}
    >
      <CreateForm duck={duck} store={store} dispatch={dispatch} />
    </Dialog>
  );
}

const CreateForm = purify(function CreateForm(props: DuckCmpProps<Duck>) {
  const { duck, store, dispatch } = props;
  const {
    ducks: { form },
    selectors,
  } = duck;
  const values = form.selectors.values(store);
  const formApi = form.getAPI(store, dispatch);
  const { configName, serviceName, configValue, configDesc, configType, tags } = formApi.getFields([
    'configName',
    'serviceName',
    'configValue',
    'configDesc',
    'configType',
    'tags',
  ]);
  const { editType, configVersion } = selectors.options(store);
  const originItem = editType === EDIT_TYPE.release ? values.currentReleaseVersion : values.lastReleaseVersion;

  return (
    <>
      <Form>
        <FormField field={configName} label={'????????????'} message={editType === EDIT_TYPE.create && nameTipMessage}>
          {editType !== EDIT_TYPE.create ? (
            <Form.Text>{configName.getValue()}</Form.Text>
          ) : (
            <Input field={configName} maxLength={60} placeholder={'?????????????????????'} />
          )}
        </FormField>
        <FormField
          field={serviceName}
          label={'????????????'}
          message={editType === EDIT_TYPE.create && '?????????????????????????????????????????????'}
        >
          {editType !== EDIT_TYPE.create ? (
            <Form.Text>{serviceName.getValue() || '-'}</Form.Text>
          ) : (
            <Input field={serviceName} maxLength={60} placeholder={'??????????????????????????????'} />
          )}
        </FormField>
        <Form.Item label='????????????' align='middle'>
          {editType !== EDIT_TYPE.create ? (
            tags.getValue().map(d => (
              <Bubble key={d.key} content={`${d.key} : ${d.value}`}>
                <Tag style={{ marginRight: 4 }} key={d.key}>
                  {d.key}: {d.value}
                </Tag>
              </Bubble>
            ))
          ) : (
            <TagConfig duck={duck} dispatch={dispatch} store={store} />
          )}
        </Form.Item>
        <FormField field={configType} label='????????????'>
          {editType !== EDIT_TYPE.create ? (
            <Form.Text>{configType.getValue()}</Form.Text>
          ) : (
            <RadioGroup
              onChange={value => {
                configValue.setError('');
                configType.setValue(value);
              }}
              value={configType.getValue()}
              layout='inline'
            >
              {Object.values(CONFIG_TYPE).map((v, index) => (
                <Radio name={v} key={index}>
                  {v}
                </Radio>
              ))}
            </RadioGroup>
          )}
        </FormField>
        <FormField field={configValue} label={'????????????'} showStatusIcon={false}>
          {editType === EDIT_TYPE.create || editType === EDIT_TYPE.generate ? (
            <CodeMirrorBox
              style={{
                borderColor: configValue.getError() && configValue.getTouched() ? '#e1504a' : '#ccc',
              }}
              value={configValue.getValue() || ''}
              onChange={value => {
                configValue.setError('');
                configValue.setValue(value);
              }}
              height={300}
              width={600}
              options={{ mode: configType.getValue() }}
            />
          ) : (
            <>
              <section
                style={{
                  backgroundColor: '#f1f1f1',
                  padding: '10px 0',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <Row>
                  <Col span={12} style={{ borderRight: '1px solid #ddd' }}>
                    <Text theme='label' reset={true} parent='div'>
                      ????????????
                      {originItem ? `(${values.configName}@${originItem?.configVersion})` : ''}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text theme='label' reset={true} parent='div'>
                      {`???????????? (${values.configName}@${configVersion})`}
                    </Text>
                  </Col>
                </Row>
              </section>
              <CodeMirrorDiff
                value={values.configValue || ''}
                originValue={originItem?.configValue || ''}
                options={{ mode: configType.getValue() }}
              />
            </>
          )}
        </FormField>
        {editType === EDIT_TYPE.create && (
          <FormField field={configDesc} label={'??????(??????)'}>
            <Input
              style={{ width: 400 }}
              multiline={true}
              field={configDesc}
              maxLength={200}
              placeholder={'?????????200?????????'}
            />
          </FormField>
        )}
      </Form>
    </>
  );
});
