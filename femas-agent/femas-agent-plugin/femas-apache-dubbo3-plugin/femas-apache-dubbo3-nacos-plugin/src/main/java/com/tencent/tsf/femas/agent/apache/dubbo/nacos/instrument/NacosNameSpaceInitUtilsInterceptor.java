/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.tsf.femas.agent.apache.dubbo.nacos.instrument;

import com.tencent.tsf.femas.agent.interceptor.StaticMethodsAroundInterceptor;
import com.tencent.tsf.femas.agent.interceptor.wrapper.InterceptResult;
import com.tencent.tsf.femas.common.context.Context;
import com.tencent.tsf.femas.common.context.ContextConstant;
import com.tencent.tsf.femas.common.context.factory.ContextFactory;
import org.apache.commons.lang3.StringUtils;

import java.lang.reflect.Method;

/**
 * @Author leoziltong@tencent.com
 * @Date: 2022/4/21 22:26
 */
public class NacosNameSpaceInitUtilsInterceptor implements StaticMethodsAroundInterceptor<InterceptResult> {

    private volatile ContextConstant contextConstant = ContextFactory.getContextConstantInstance();

    @Override
    public InterceptResult beforeMethod(Class clazz, Method method, Object[] allArguments, Class[] parameterTypes) throws Throwable {
        InterceptResult result = new InterceptResult();
        String namespace = Context.getSystemTag(contextConstant.getNamespaceId());
        if (StringUtils.isNotBlank(namespace)) {
            result.defineReturnValue(namespace);
        }
        return result;
    }

    @Override
    public Object afterMethod(Class clazz, Method method, Object[] allArguments, Class[] parameterTypes, Object ret) throws Throwable {
        return ret;
    }

    @Override
    public void handleMethodException(Class clazz, Method method, Object[] allArguments, Class[] parameterTypes, Throwable t) {

    }
}
