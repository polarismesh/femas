import * as React from 'react';
import { Button, Form, FormItem, InputAdornment, Text } from 'tea-component';
import { DuckCmpProps, memorize } from 'saga-duck';
import Duck from './PageDuck';
import FormField from '@src/common/duckComponents/form/Field';
import Input from '@src/common/duckComponents/form/Input';
import Checkbox from '@src/common/duckComponents/form/Checkbox';
import AutoCompleteSelector from '@src/common/components/AutoComplete';
import { CallTypeList, CallTypeMap, getDateTimeSelectRange } from '@src/app/apm/types';
import TagConfig from '../search/TagConfig';
import formatDate from '@src/common/util/formatDate';
import TimeSelect from '@src/common/components/TimeSelect';
import Service from '@src/app/service/components/Service';

const getHandlers = memorize(({ creators }: Duck, dispatch) => ({
  execSearch: () => dispatch(creators.execSearch()),
}));

export default class CreateForm extends React.Component<DuckCmpProps<Duck>, {}> {
  timePicker: any;

  constructor(props) {
    super(props);
    this.preSubmit = this.preSubmit.bind(this);
  }

  get fields() {
    const { duck, store, dispatch } = this.props;
    const {
      ducks: { form },
    } = duck;
    return form
      .getAPI(store, dispatch)
      .getFields([
        'startTime',
        'endTime',
        'client',
        'server',
        'callStatus',
        'minDuration',
        'maxDuration',
        'clientApi',
        'serverApi',
        'callType',
        'statusCode',
        'showHigh',
        'clientInstanceIp',
        'serverInstanceIp',
        'traceId',
        'spanId',
      ]);
  }

  preSubmit() {
    this.timePicker && this.timePicker.flush();
    const handlers = getHandlers(this.props);
    handlers.execSearch();
  }

  render() {
    const { duck, store, dispatch } = this.props;
    const {
      ducks: { form },
    } = duck;
    const {
      startTime,
      endTime,
      client,
      server,
      callStatus,
      minDuration,
      maxDuration,
      clientApi,
      serverApi,
      callType,
      statusCode,
      showHigh,
      clientInstanceIp,
      serverInstanceIp,
      traceId,
      spanId,
    } = this.fields;

    const changeDate = time => {
      const { from, to } = time;
      startTime.setValue(formatDate(from));
      endTime.setValue(formatDate(to));
    };

    const toggleHigh = () => {
      showHigh.setValue(!showHigh.getValue());
    };

    const durationStatus =
      (minDuration.getTouched() && minDuration.getError()) || (maxDuration.getTouched() && maxDuration.getError());

    return (
      <Form>
        <FormItem label={'????????????'} align='middle'>
          <TimeSelect
            from={startTime.getValue()}
            to={endTime.getValue()}
            ref={picker => (this.timePicker = picker)}
            changeDate={changeDate}
            range={getDateTimeSelectRange()}
          />
        </FormItem>
        <FormField field={traceId} label={'Trace ID'}>
          <Input field={traceId} placeholder={'?????????traceId'} />
        </FormField>
        <FormField field={spanId} label={'Span ID'}>
          <Input field={spanId} placeholder={'?????????spanId'} />
        </FormField>
        <FormField field={client} label={'?????????'} align='middle'>
          <Service
            duck={form.ducks.clientService}
            dispatch={dispatch}
            store={store}
            onChange={v => client.setValue(v)}
          />
        </FormField>
        <FormField field={server} label={'?????????'} align='middle'>
          <Service
            duck={form.ducks.serverService}
            dispatch={dispatch}
            store={store}
            onChange={v => server.setValue(v)}
          />
        </FormField>
        <FormField field={callStatus} label={'????????????'}>
          <Checkbox field={callStatus} label='??????' />
        </FormField>
        <FormItem label={'????????????'} align='middle'>
          <InputAdornment after='ms'>
            <Input
              field={minDuration}
              size='s'
              style={{
                borderColor: minDuration.getTouched() && minDuration.getError() ? 'red' : '#ddd',
                zIndex: 1,
              }}
            />
          </InputAdornment>
          <Text reset verticalAlign='middle' style={{ margin: '0 15px' }}>
            ???
          </Text>
          <InputAdornment after='ms'>
            <Input
              field={maxDuration}
              size='s'
              style={{
                borderColor: maxDuration.getTouched() && maxDuration.getError() ? 'red' : '#ddd',
                zIndex: 1,
              }}
            />
          </InputAdornment>
          {durationStatus && (
            <Text parent='div' className='tea-form__help-text' theme='danger'>
              {durationStatus}
            </Text>
          )}
        </FormItem>
        {showHigh.getValue() && (
          <>
            <FormField field={clientApi} label={'???????????????'}>
              <Input field={clientApi} placeholder={'???????????????????????????'} />
            </FormField>
            <FormField field={serverApi} label={'???????????????'}>
              <Input field={serverApi} placeholder={'???????????????????????????'} />
            </FormField>
            <FormField field={clientInstanceIp} label={'?????????IP'}>
              <Input field={clientInstanceIp} placeholder={'??????????????????IP'} />
            </FormField>
            <FormField field={serverInstanceIp} label={'?????????IP'}>
              <Input field={serverInstanceIp} placeholder={'??????????????????IP'} />
            </FormField>
            <FormField field={callType} label={'????????????'} align='middle'>
              <AutoCompleteSelector
                value={callType.getValue() && callType.getValue()}
                onItemSelect={item => {
                  statusCode.setValue('');
                  callType.setValue(item?.value || '');
                }}
                dataSource={CallTypeList}
                showBubble
              />
            </FormField>
            {(callType.getValue() === CallTypeMap.http || callType.getValue() === CallTypeMap.rpc) && (
              <FormField field={statusCode} label={'?????????'}>
                <Input field={statusCode} placeholder={'????????????????????????403'} />
              </FormField>
            )}
          </>
        )}
        <TagConfig
          duck={form}
          dispatch={dispatch}
          store={store}
          message='Tag?????????????????????????????????????????????????????????span????????????????????????????????????????????????????????????'
          title='???????????????Tag???'
        />
        <FormItem
          label={
            <Button type='link' onClick={toggleHigh}>
              {showHigh.getValue() ? '??????????????????' : '??????????????????'}
            </Button>
          }
        />
        <FormItem
          label={
            <Button type='primary' title={'??????'} onClick={this.preSubmit}>
              ??????
            </Button>
          }
        />
      </Form>
    );
  }
}
