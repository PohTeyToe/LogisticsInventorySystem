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
            // Skip tenant resolution for Swagger endpoints
            if (context.Request.Path.StartsWithSegments("/swagger"))
            {
                await _next(context);
                return;
            }

            var tenantIdHeader = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            int tenantId;

            if (string.IsNullOrEmpty(tenantIdHeader))
            {
                // No tenant header — default to 0 (no tenant, returns empty)
                tenantId = 0;
            }
            else if (int.TryParse(tenantIdHeader, out var parsedId))
            {
                tenantId = parsedId;
            }
            else
            {
                // Non-numeric tenant ID — try to extract numeric portion or reject
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"X-Tenant-Id must be a numeric value (e.g., 1, 2, 3)\"}");
                return;
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
