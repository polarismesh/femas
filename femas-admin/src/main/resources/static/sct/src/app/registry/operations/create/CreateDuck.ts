import FormDialog from '@src/common/ducks/FormDialog';
import Form from '@src/common/ducks/Form';
import { ClusterType, K8S_HTTP_PROTOCOL, K8S_NATIVE_TYPE, RegistryItem } from '../../types';
import { put, select, takeLatest } from 'redux-saga/effects';
import { reduceFromPayload, resolvePromise } from 'saga-duck/build/helper';
import { configureRegistry, checkCertificateConf } from '../../model';
import { nameTipMessage } from '@src/common/types';
import { checkPath } from '@src/common/util/check';

export interface DialogOptions {
  registryId?: string;
  addMode: boolean;
}
export default class CreateDuck extends FormDialog {
  Options: DialogOptions;
  get Form() {
    return CreateFormDuck;
  }
  *onSubmit() {
    const {
      selectors,
      ducks: { form },
    } = this;
    const { addMode, registryId } = selectors.options(yield select());
    const {
      registryType,
      registryName,
      registryCluster,
      certificateType,
      kubeConfig,
      k8sApiProtocol,
      secret,
      apiServer,
      username,
      password,
    } = form.selectors.values(yield select());
    const params = {
      registryName,
      registryType,
      registryCluster,
    } as any;
    if (registryType === ClusterType.K8s) {
      params.certificateType = certificateType;
      if (certificateType === K8S_NATIVE_TYPE.kubeconfig) {
        params.kubeConfig = kubeConfig;
      } else {
        params.apiServerAddr = k8sApiProtocol + apiServer;
        params.secret = secret;
      }
    }

    if(registryType === ClusterType.Nacos){
      params.username = username;
      params.password = password;
    }

    if (addMode) {
      const res = yield* resolvePromise(configureRegistry(params));
      return res;
    } else {
      params.registryId = registryId;
      const res = yield* resolvePromise(configureRegistry(params));
      return res;
    }
  }
  *onShow() {
    yield* super.onShow();
    const {
      selectors,
      ducks: { form },
    } = this;
    const options = selectors.options(yield select());
    const data = selectors.data(yield select());
    const [protocol, apiServer] = data?.apiServerAddr?.split('://') || [];
    yield put(
      form.creators.setValues({
        ...data,
        registryType: data?.registryType || ClusterType.Consul,
        certificateType: data?.certificateType || K8S_NATIVE_TYPE.kubeconfig,
        k8sApiProtocol: data?.apiServerAddr ? protocol + '://' : K8S_HTTP_PROTOCOL.http,
        apiServer: data?.apiServerAddr ? apiServer : '',
      }),
    );
    yield put(form.creators.setMeta(options));
    // TODO ?????????????????????????????????????????????cancel
  }
}
export interface Values
  extends Pick<
    RegistryItem,
    'registryName' | 'registryType' | 'registryCluster' | 'certificateType' | 'kubeConfig' | 'secret' | 'apiServerAddr'
  > {
  k8sApiProtocol?: string;
  apiServer?: string;
  username?:string;
  password?:string;
}

interface CheckResult {
  success: boolean;
  message?: string;
}

export class CreateFormDuck extends Form {
  Values: Values;
  Meta: DialogOptions;
  get quickTypes() {
    enum Types {
      RETEST_K8S_CONNECTION,
      SET_K8_CONFIG_CHECK_RESULT,
      SET_SERVICEAC_CHECK_RESULT,
    }
    return {
      ...super.quickTypes,
      ...Types,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      ...super.reducers,
      k8configCheckResult: reduceFromPayload<CheckResult>(types.SET_K8_CONFIG_CHECK_RESULT, null),
      servcieAcCheckResult: reduceFromPayload<CheckResult>(types.SET_SERVICEAC_CHECK_RESULT, null),
    };
  }
  get rawSelectors() {
    type State = this['State'];
    return {
      ...super.rawSelectors,
      k8configCheckResult: (state: State) => state.k8configCheckResult,
      servcieAcCheckResult: (state: State) => state.servcieAcCheckResult,
    };
  }
  get creators() {
    const { types } = this;
    return {
      ...super.creators,
      retestK8sConnection: () => ({ type: types.RETEST_K8S_CONNECTION }),
    };
  }
  validate(v: this['Values'], meta: this['Meta']) {
    return validator(v, meta);
  }
  *saga() {
    yield* super.saga();
    const { types, selectors } = this;
    yield takeLatest(types.RETEST_K8S_CONNECTION, function*() {
      const { registryType, kubeConfig, apiServer, secret, certificateType, k8sApiProtocol,username,password } = selectors.values(
        yield select(),
      );
      const { addMode, registryId } = selectors.validateMeta(yield select());
      if (registryType !== ClusterType.K8s) {
        return;
      }
      const params = {
        certificateType,
        registryType,
      } as any;
      if (!addMode) {
        params.registryId = registryId;
      }

      if (certificateType === K8S_NATIVE_TYPE.kubeconfig && kubeConfig) {
        // ??????kubeconfig
        params.kubeConfig = kubeConfig;
        const result = yield checkCertificateConf(params);
        yield put({ type: types.SET_K8_CONFIG_CHECK_RESULT, payload: result });
        return;
      }
      const server = k8sApiProtocol + apiServer;
      if (certificateType === K8S_NATIVE_TYPE.serviceAccount && apiServer && !checkPath(server) && secret) {
        // ??????service account
        params.apiServerAddr = server;
        params.secret = secret;
        const result = yield checkCertificateConf(params);
        yield put({ type: types.SET_SERVICEAC_CHECK_RESULT, payload: result });
        return;
      }
    });
  }
}
const validator = CreateFormDuck.combineValidators<Values, {}>({
  registryName(v) {
    if (!v) {
      return '???????????????????????????';
    }
    if (v?.length > 60 || !/^[a-z0-9]([-_a-z0-9]*[a-z0-9])?$/.test(v)) {
      return nameTipMessage;
    }
  },
  registryType(v) {
    if (!v) {
      return '???????????????????????????';
    }
  },
  registryCluster(v, values) {
    if (values.registryType === ClusterType.K8s) return;
    if (!v) {
      return '?????????????????????';
    }
  },
  kubeConfig(v, values) {
    if (values.registryType !== ClusterType.K8s || values.certificateType !== K8S_NATIVE_TYPE.kubeconfig) {
      return;
    }
    if (!v) {
      return '?????????kubeconfig??????';
    }
  },
  apiServer(v, values) {
    if (values.registryType !== ClusterType.K8s || values.certificateType !== K8S_NATIVE_TYPE.serviceAccount) {
      return;
    }
    if (!v) {
      return '?????????API Server??????';
    }
    if (checkPath(values.k8sApiProtocol + v)) {
      return '??????????????????URL';
    }
  },
  secret(v, values) {
    if (values.registryType !== ClusterType.K8s || values.certificateType !== K8S_NATIVE_TYPE.serviceAccount) {
      return;
    }
    if (!v) {
      return '?????????Secret?????????yaml??????';
    }
  },
});
