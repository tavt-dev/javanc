package com.javanc.gateway.application.port;

import com.javanc.gateway.application.model.ForwardRequest;
import com.javanc.gateway.application.model.ForwardResponse;
import io.smallrye.mutiny.Uni;

public interface RequestForwardingPort {
    Uni<ForwardResponse> forward(ForwardRequest request);
}
