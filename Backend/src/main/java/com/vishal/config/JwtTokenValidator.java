package com.vishal.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;

public class JwtTokenValidator extends OncePerRequestFilter {

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String authHeader = request.getHeader(JwtConstant.JWT_HEADER);

		// BUGFIX: only attempt to parse the header when it actually looks like a
		// "Bearer <token>" value. Previously jwt.substring(7) ran BEFORE the
		// try/catch, so any short/malformed header (e.g. "Authorization: abc")
		// threw an uncaught StringIndexOutOfBoundsException straight out of the filter.
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String jwt = authHeader.substring(7);

			try {

				SecretKey key= Keys.hmacShaKeyFor(JwtConstant.SECRET_KEY.getBytes());

				Claims claims=Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(jwt).getBody();

				String email=String.valueOf(claims.get("email"));

				String authorities=String.valueOf(claims.get("authorities"));

				List<GrantedAuthority> auths=AuthorityUtils.commaSeparatedStringToAuthorityList(authorities);
				Authentication athentication=new UsernamePasswordAuthenticationToken(email,null, auths);

				SecurityContextHolder.getContext().setAuthentication(athentication);

			} catch (Exception e) {
				// BUGFIX: this used to throw a RuntimeException, which propagates straight
				// out of the servlet filter chain (filters run BEFORE the DispatcherServlet,
				// so @ControllerAdvice/GlobelExeptions never gets a chance to handle it) and
				// surfaces to the client as a generic, unhandled 500 Internal Server Error.
				// Instead, simply leave the request unauthenticated: Spring Security's normal
				// authorization rules will then correctly reject access to protected
				// endpoints with a clean 401/403, while public endpoints keep working.
				SecurityContextHolder.clearContext();
			}
		}
		filterChain.doFilter(request, response);

	}



}
