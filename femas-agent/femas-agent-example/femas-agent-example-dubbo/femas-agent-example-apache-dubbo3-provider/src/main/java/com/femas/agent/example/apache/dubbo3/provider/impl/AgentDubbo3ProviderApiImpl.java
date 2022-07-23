package com.femas.agent.example.apache.dubbo3.provider.impl;

import com.femas.agent.example.apache.dubbo3.api.AgentDubbo3ProviderApi;
import org.apache.dubbo.config.annotation.DubboService;

@DubboService(version = "1.0")
public class AgentDubbo3ProviderApiImpl implements AgentDubbo3ProviderApi {
    @Override
    public String hello(String name) {
        return "hello " + name;
    }
}
