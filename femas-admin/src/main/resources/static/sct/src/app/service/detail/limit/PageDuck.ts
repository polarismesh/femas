import { MonitorData } from '@src/app/apm/types';
import { put, select } from 'redux-saga/effects';
import { takeLatest } from 'redux-saga-catch';
import GridPage, { Filter as BaseFilter } from '@src/common/ducks/GridPage';
import { configureLimitRule, deleteLimitRule, fetchServiceLimitList } from './model';
import { ComposedId } from '../types';
import { createToPayload, reduceFromPayload } from 'saga-duck';
import { LimitRuleItem } from './types';
import { Modal, notification } from 'tea-component';
import { RULE_STATUS } from '../../types';
import { FilterTime } from '@src/common/types';
import moment from 'moment';
import { fetchRateLimitMetric } from '../../model';
import { caculateTimeDiff } from '@src/common/qcm-chart/core/lib/helper';
import formatDate from '@src/common/util/formatDate';

interface Filter extends BaseFilter {
  serviceName: string;
  namespaceId: string;
  registryId: string;
}

interface Data {
  limitMetric: Array<MonitorData>;
  requestMetric: Array<MonitorData>;
}

enum Types {
  LOAD,
  REMOVE,
  CHANGE_STATUS,
  SET_STATUS,
  SET_FILTER_TIME,
  SET_MONITOR_LOADING,
  SET_MONITOR_DATA,
}

export default class PageDuck extends GridPage {
  baseUrl = null;
  Filter: Filter;
  Item: LimitRuleItem;

  get recordKey() {
    return 'ruleId';
  }

  get initialFetch() {
    return false;
  }

  get watchTypes() {
    return [...super.watchTypes, this.types.LOAD];
  }

  get quickTypes() {
    return {
      ...super.quickTypes,
      ...Types,
    };
  }

  get reducers() {
    const { types } = this;
    return {
      ...super.reducers,
      composedId: reduceFromPayload(types.LOAD, {} as ComposedId),
      filterTime: reduceFromPayload(types.SET_FILTER_TIME, {} as FilterTime),
      monitorLoading: reduceFromPayload(types.SET_MONITOR_LOADING, true),
      monitorData: reduceFromPayload(types.SET_MONITOR_DATA, {} as Data),
    };
  }

  get creators() {
    const { types } = this;
    return {
      ...super.creators,
      load: createToPayload(types.LOAD),
      remove: createToPayload(types.REMOVE),
      changeStatus: createToPayload(types.CHANGE_STATUS),
      setFilterTime: createToPayload(types.SET_FILTER_TIME),
    };
  }

  get rawSelectors() {
    type State = this['State'];
    return {
      ...super.rawSelectors,
      filter: (state: State) => ({
        serviceName: state.composedId.serviceName,
        namespaceId: state.composedId.namespaceId,
        registryId: state.composedId.registryId,
        keyword: state.keyword,
        page: state.page,
        count: state.count,
      }),
      composedId: (state: State) => state.composedId,
      list: (state: State) => state.grid.list,
      filterTime: (state: State) => state.filterTime,
      monitorLoading: (state: State) => state.monitorLoading,
      monitorData: (state: State) => state.monitorData,
    };
  }

  *saga() {
    yield* super.saga();
    const { types, creators, selectors } = this;
    //???????????????????????????
    yield takeLatest(types.CHANGE_STATUS, function*(action) {
      const item = action.payload;
      const { status } = item;
      const confirm = yield Modal.confirm({
        message: '????????????/?????????????????????????????????',
        description: !status ? '????????????????????????????????????????????????' : '??????????????????????????????????????????',
      });
      if (!confirm) return;
      //?????????????????????????????????
      const params = {
        ...item,
        status: status ? RULE_STATUS.OPEN : RULE_STATUS.CLOSE,
      };
      try {
        yield configureLimitRule(params);
        notification.success({
          description: `${status ? '??????' : '??????'}????????????????????????`,
        });
        yield put(creators.reload());
      } catch (e) {
        notification.error({
          description: `${status ? '??????' : '??????'}????????????????????????`,
        });
      }
    });

    //????????????
    yield takeLatest(types.REMOVE, function*(action) {
      const { namespaceId, serviceName } = selectors.composedId(yield select());
      const confirm = yield Modal.confirm({
        message: '???????????????????????????????????????',
        description: '????????????????????????????????????????????????',
      });
      if (!confirm) return;
      const { ruleId } = action.payload;
      yield deleteLimitRule({
        namespaceId,
        serviceName,
        ruleId,
      });
      yield put(creators.reload());
    });
    yield takeLatest(types.SET_FILTER_TIME, function*(action) {
      const { namespaceId, serviceName } = selectors.composedId(yield select());
      const { startTime, endTime } = action.payload;
      // ??????????????????
      yield put({ type: types.SET_MONITOR_LOADING, payload: true });
      const step = caculateTimeDiff(startTime, endTime) > 86400 ? 300 : 60;
      const { limitMetric, requestMetric } = yield fetchRateLimitMetric({
        namespaceId,
        serviceName,
        startTime: +moment(startTime),
        endTime: +moment(endTime),
        step,
      });
      const monitorData = {
        limitMetric: [
          {
            name: '??????????????????',
            unit: '%',
            value: limitMetric?.map(d => ({
              label: formatDate(d.time),
              value: d.value,
            })),
            additionalTip: ['???????????????sum', `???????????????${step / 60}??????`],
          },
        ],
        requestMetric: [
          {
            name: '???????????????',
            unit: '???',
            value: requestMetric?.map(d => ({
              label: formatDate(d.time),
              value: d.value,
            })),
            additionalTip: ['???????????????sum', `???????????????${step / 60}??????`],
          },
        ],
      };
      yield put({ type: types.SET_MONITOR_DATA, payload: monitorData });
      yield put({ type: types.SET_MONITOR_LOADING, payload: false });
    });
  }

  async getData(filter: Filter) {
    const { page, count, namespaceId, serviceName, keyword, registryId } = filter;
    const result = await fetchServiceLimitList({
      pageNo: page,
      pageSize: count,
      namespaceId,
      serviceName,
      keyword,
    });
    return {
      totalCount: result.totalCount,
      list: result.list?.map(item => ({ ...item, registryId })) || [],
    };
  }
}
