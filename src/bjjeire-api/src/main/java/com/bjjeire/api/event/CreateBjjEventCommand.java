package com.bjjeire.api.event;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateBjjEventCommand(@NotNull @Valid BjjEventDto data) {}
