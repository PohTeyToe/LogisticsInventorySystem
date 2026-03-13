using LogisticsAPI.Data;

namespace LogisticsAPI.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip tenant resolution for Swagger and auth endpoints
            if (context.Request.Path.StartsWithSegments("/swagger") ||
                context.Request.Path.StartsWithSegments("/api/auth") ||
                context.Request.Path.StartsWithSegments("/hubs"))
            {
                await _next(context);
                return;
            }

            int tenantId;

            // If the user is authenticated, use tenant_id from JWT claim
            var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrEmpty(tenantClaim) && int.TryParse(tenantClaim, out var claimTenantId))
            {
                // Authenticated user — validate that X-Tenant-Id header (if sent) matches JWT
                var tenantIdHeader = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
                if (!string.IsNullOrEmpty(tenantIdHeader) &&
                    int.TryParse(tenantIdHeader, out var headerTenantId) &&
                    headerTenantId != claimTenantId)
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"error\":\"X-Tenant-Id does not match your account's tenant.\"}");
                    return;
                }

                tenantId = claimTenantId;
            }
            else
            {
                // Unauthenticated request (health check, etc.) — use header or default
                var tenantIdHeader = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();

                if (string.IsNullOrEmpty(tenantIdHeader))
                {
                    tenantId = 1;
                }
                else if (int.TryParse(tenantIdHeader, out var parsedId))
                {
                    tenantId = parsedId;
                }
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"error\":\"X-Tenant-Id must be a numeric value (e.g., 1, 2, 3)\"}");
                    return;
                }
            }

            // Set tenant on the DbContext
            var dbContext = context.RequestServices.GetRequiredService<ApplicationDbContext>();
            dbContext.SetTenantId(tenantId);

            // Store tenant ID in HttpContext.Items for other services
            context.Items["TenantId"] = tenantId;

            await _next(context);
        }
    }

    public static class TenantMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantMiddleware>();
        }
    }
}
