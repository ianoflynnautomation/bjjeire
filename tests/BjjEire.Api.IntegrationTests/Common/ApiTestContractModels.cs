// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Common;

public record FieldError(string Field, string Message, string? ErrorCode = null);
