package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument.filter;

import com.tencent.tsf.femas.agent.dubbo.common.util.ApachDubboRequestMetaUtils;
import com.tencent.tsf.femas.api.ExtensionManager;
import com.tencent.tsf.femas.api.IExtensionLayer;
import com.tencent.tsf.femas.common.context.Context;
import com.tencent.tsf.femas.common.context.ContextConstant;
import com.tencent.tsf.femas.common.context.factory.ContextFactory;
import com.tencent.tsf.femas.common.entity.ErrorStatus;
import com.tencent.tsf.femas.common.entity.Request;
import com.tencent.tsf.femas.common.entity.Response;
import com.tencent.tsf.femas.common.entity.Service;
import org.apache.dubbo.common.constants.CommonConstants;
import org.apache.dubbo.common.extension.Activate;
import org.apache.dubbo.rpc.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;
/**
 * apache dubbo provider Filter spi impl
 */


@Activate( group = CommonConstants.PROVIDER, order = -10000 + 2)
public class ApacheDubboProviderAgentFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(ApacheDubboProviderAgentFilter.class);

    private volatile ContextConstant contextConstant = ContextFactory.getContextConstantInstance();
    private IExtensionLayer extensionLayer = ExtensionManager.getExtensionLayer();

    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        RpcContext.getServiceContext().setInvoker(invoker)
                .setInvocation(invocation);

        RpcContext rpcContext = RpcContext.getServerAttachment().setRemoteApplicationName(invocation.getServiceName());
        Request femasRequest = getFemasRequest(invoker.getUrl().getApplication());

        com.tencent.tsf.femas.common.context.RpcContext femasRpcContext =
                extensionLayer.beforeServerInvoke(femasRequest, ApachDubboRequestMetaUtils.create(rpcContext));

        Throwable error = null;

        try {
            if (Objects.equals(ErrorStatus.UNAUTHENTICATED, femasRpcContext.getErrorStatus())) {
                throw new RuntimeException("Unauthorized error, Request : " + femasRequest);
            }

            if (Objects.equals(ErrorStatus.RESOURCE_EXHAUSTED, femasRpcContext.getErrorStatus())) {
                throw new RuntimeException("Resource exhausted error, Request : " + femasRequest);
            }
            return invoker.invoke(invocation);
        } catch (Throwable throwable) {
            error = throwable;
            throw throwable;
        } finally {
            Response response = new Response();
            response.setError(error);
            extensionLayer.afterServerInvoke(response, femasRpcContext);
        }

    }

    private Request getFemasRequest(String serviceName) {
        String namespace = Context.getSystemTag(contextConstant.getNamespaceId());
        Service service = new Service(namespace, serviceName);
        Request request = new Request();
        request.setTargetService(service);
        return request;
    }

}
