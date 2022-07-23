package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument;

import com.tencent.tsf.femas.agent.classloader.AgentClassLoader;
import com.tencent.tsf.femas.agent.classloader.InterceptorClassLoaderCache;
import com.tencent.tsf.femas.agent.interceptor.InstanceMethodsAroundInterceptor;
import com.tencent.tsf.femas.agent.interceptor.wrapper.InterceptResult;
import com.tencent.tsf.femas.common.context.factory.ContextFactory;
import org.apache.dubbo.rpc.Invoker;
import org.apache.dubbo.rpc.model.ApplicationModel;

import java.lang.reflect.Method;

/**
 * dubbo FilterChainBuilder Agent Interceptor
 */

public class FilterChainBuilderInterceptor implements InstanceMethodsAroundInterceptor<InterceptResult> {
    private final String path = "org.apache.dubbo.metadata.MetadataService";

    @Override
    public InterceptResult beforeMethod(Method method, Object[] allArguments, Class<?>[] argumentsTypes) throws Throwable {
        Invoker invoker = (Invoker) allArguments[0];

        if (path.equals(invoker.getUrl().getPath())) {
            return new InterceptResult();
        }

        AgentClassLoader agentClassLoader;
        try {
            agentClassLoader = InterceptorClassLoaderCache.getAgentClassLoader(ContextFactory.class.getClassLoader());
        } catch (Exception e) {
            agentClassLoader = InterceptorClassLoaderCache.getAgentClassLoader(Thread.currentThread().getContextClassLoader());
        }

        Thread.currentThread().setContextClassLoader(agentClassLoader);
        ApplicationModel applicationModel = invoker.getUrl().getApplicationModel();
        applicationModel.getDefaultModule().addClassLoader(agentClassLoader);

        return new InterceptResult();
    }


    @Override
    public Object afterMethod(Method method, Object[] allArguments, Class<?>[] argumentsTypes, Object ret) throws Throwable {
        return ret;
    }
}
