// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Application.Common.Exceptions;


public class BjjEireException : Exception
{

    public BjjEireException()
    {
    }

    public BjjEireException(string message)
        : base(message)
    {
    }

}
