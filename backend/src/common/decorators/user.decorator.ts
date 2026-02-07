import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type JwtUser = {
  id?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
