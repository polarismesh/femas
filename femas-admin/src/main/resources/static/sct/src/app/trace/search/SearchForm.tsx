import * as React from 'react';
import { Button, Form, FormItem, InputAdornment, Text } from 'tea-component';
import { DuckCmpProps, memorize } from 'saga-duck';
import Duck from './PageDuck';
import { getDateTimeSelectRange } from '@src/app/apm/types';
import TagConfig from './TagConfig';
import FormField from '@src/common/duckComponents/form/Field';
import Input from '@src/common/duckComponents/form/Input';
import Checkbox from '@src/common/duckComponents/form/Checkbox';
import formatDate from '@src/common/util/formatDate';
import TimeSelect from '@src/common/components/TimeSelect';
import Service from '@src/app/service/components/Service';
import AutoComplete from '@src/common/components/AutoComplete';
import { ORDER_TYPE_NAME, OrderType } from './SearchFormDuck';

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
        'service',
        'traceId',
        'minDuration',
        'maxDuration',
        'api',
        'callStatus',
        'showHigh',
        'orderType',
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
      service,
      traceId,
      minDuration,
      maxDuration,
      api,
      callStatus,
      showHigh,
      orderType,
    } = this.fields;

    const changeDate = time => {
      const { from, to } = time;
      startTime.setValue(formatDate(from));
      endTime.setValue(formatDate(to));
      dispatch(form.creators.loadService());
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
        <FormField field={service} label={'????????????'} align='middle'>
          <Service
            duck={form.ducks.serviceDuck}
            dispatch={dispatch}
            store={store}
            onChange={v => service.setValue(v)}
          />
        </FormField>
        <FormField field={traceId} label={'Trace ID'}>
          <Input field={traceId} placeholder={'?????????traceId'} />
        </FormField>
        <FormField field={callStatus} label={'???????????????'}>
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
            <FormField field={api} label={'??????????????????'}>
              <Input field={api} placeholder={'??????????????????'} />
            </FormField>
            <FormField field={orderType} label='????????????' align='middle'>
              <AutoComplete
                dataSource={Object.values(OrderType).map(value => ({
                  value,
                  text: ORDER_TYPE_NAME[value],
                }))}
                value={orderType.getValue()}
                onItemSelect={item => orderType.setValue(item?.value || '')}
              />
            </FormField>
          </>
        )}
        <TagConfig duck={form} dispatch={dispatch} store={store} />
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
