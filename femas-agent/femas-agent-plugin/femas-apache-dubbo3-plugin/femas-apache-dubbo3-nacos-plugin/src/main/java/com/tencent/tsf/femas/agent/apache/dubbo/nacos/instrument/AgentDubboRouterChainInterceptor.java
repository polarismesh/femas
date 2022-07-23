package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument;

import com.tencent.tsf.femas.agent.classloader.AgentClassLoader;
import com.tencent.tsf.femas.agent.classloader.InterceptorClassLoaderCache;
import com.tencent.tsf.femas.agent.interceptor.InstanceMethodsAroundInterceptor;
import com.tencent.tsf.femas.agent.interceptor.wrapper.InterceptResult;
import com.tencent.tsf.femas.common.context.factory.ContextFactory;
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.extension.ExtensionDirector;
import org.apache.dubbo.rpc.model.ModuleModel;

import java.lang.reflect.Method;


/**
 *  dubbo RouterChain Agent Interceptor
 */

public class AgentDubboRouterChainInterceptor implements InstanceMethodsAroundInterceptor<InterceptResult> {
    private final String path = "org.apache.dubbo.metadata.MetadataService";


    @Override
    public InterceptResult beforeMethod(Method method, Object[] allArguments, Class<?>[] argumentsTypes) throws Throwable {
        URL url = (URL) allArguments[3];

//        if (path.equals(url.getPath())) {
//            return new InterceptResult();
//        }

        AgentClassLoader agentClassLoader;
        try {
            agentClassLoader = InterceptorClassLoaderCache.getAgentClassLoader(ContextFactory.class.getClassLoader());
        } catch (Exception e) {
            agentClassLoader = InterceptorClassLoaderCache.getAgentClassLoader(Thread.currentThread().getContextClassLoader());
        }

        Thread.currentThread().setContextClassLoader(agentClassLoader);
        ModuleModel moduleModel = url.getOrDefaultModuleModel();
        moduleModel.addClassLoader(agentClassLoader);
        ExtensionDirector extensionDirector = moduleModel.getExtensionDirector();
        extensionDirector.getParent().removeAllCachedLoader();
        url.setScopeModel(moduleModel);

        return new InterceptResult();
    }

    @Override
    public Object afterMethod(Method method, Object[] allArguments, Class<?>[] argumentsTypes, Object ret) throws Throwable {
        return ret;
    }
}
