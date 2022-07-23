package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument.filter;

import com.tencent.tsf.femas.agent.dubbo.common.util.ApachDubboRequestMetaUtils;
import com.tencent.tsf.femas.agent.dubbo.common.util.CommonUtils;
import com.tencent.tsf.femas.api.ExtensionManager;
import com.tencent.tsf.femas.api.IExtensionLayer;
import com.tencent.tsf.femas.common.context.Context;
import com.tencent.tsf.femas.common.entity.ErrorStatus;
import com.tencent.tsf.femas.common.entity.Request;
import com.tencent.tsf.femas.common.entity.Response;
import com.tencent.tsf.femas.common.entity.Service;
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.constants.CommonConstants;
import org.apache.dubbo.common.extension.Activate;
import org.apache.dubbo.registry.client.InstanceAddressURL;
import org.apache.dubbo.rpc.*;
import org.apache.dubbo.rpc.listener.ListenerInvokerWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

/**
 * apache dubbo consumer Filter spi impl
 */

@Activate(group = CommonConstants.CONSUMER, order = -10000 + 2)
public class ApacheDubboConsumerAgentFilter implements Filter {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApacheDubboConsumerAgentFilter.class);
    private IExtensionLayer extensionLayer = ExtensionManager.getExtensionLayer();
    private final String ATTACHMENT_ARG = "_st";

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        RpcContext.getServiceContext().setInvoker(invoker)
                .setInvocation(invocation);

        String serviceName = null;

        URL url = ((ListenerInvokerWrapper) invoker).getInvoker().getUrl();
        if (url instanceof InstanceAddressURL){
            InstanceAddressURL instanceAddressURL = (InstanceAddressURL) url;
            serviceName = instanceAddressURL.getInstance().getServiceName();
        }

        Request femasRequest = Context.getRpcInfo().getRequest();
        RpcContext rpcContext = RpcContext.getClientAttachment().setRemoteApplicationName(invocation.getServiceName());

        if (Objects.isNull(femasRequest)) {
            femasRequest = CommonUtils.getFemasRequest(invoker.getUrl(), invocation);
        }

        if (!invocation.getObjectAttachments().containsKey(ATTACHMENT_ARG)){
            Service targetService = femasRequest.getTargetService();
            targetService.setName(serviceName);
            femasRequest.setTargetService(targetService);
        }

        com.tencent.tsf.femas.common.context.RpcContext femasRpcContext =
                extensionLayer.beforeClientInvoke(femasRequest, ApachDubboRequestMetaUtils.create(rpcContext));

        Throwable error = null;

        try {
            if (Objects.nonNull(femasRpcContext.getErrorStatus()) && Objects.equals(ErrorStatus.Code.CIRCUIT_BREAKER,
                    femasRpcContext.getErrorStatus().getCode())) {
                throw new RuntimeException("CircuitBreaker Error. IsolationLevel : " +
                        femasRpcContext.getErrorStatus().getMessage() + ", Request : " + femasRequest);
            }

            return invoker.invoke(invocation);
        } catch (Throwable throwable) {
            error = throwable;
            throw  throwable;
        } finally {
            Response response = new Response();
            if (error != null) {
                response.setErrorStatus(ErrorStatus.INTERNAL);
                response.setError(error);
            }
            extensionLayer.afterClientInvoke(femasRequest, response, femasRpcContext);
        }
    }
}
