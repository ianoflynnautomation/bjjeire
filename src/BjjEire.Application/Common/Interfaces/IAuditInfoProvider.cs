// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.Common.Interfaces;

public interface IAuditInfoProvider
{
    public string GetCurrentUser();
    public DateTime GetCurrentDateTime();
}
