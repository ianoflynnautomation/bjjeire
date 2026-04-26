// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities;

public static class UniqueIdentifier
{
    public static string New => ObjectId.GenerateNewId().ToString();
}
