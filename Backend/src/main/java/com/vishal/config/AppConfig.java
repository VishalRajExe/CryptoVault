package com.vishal.config;


import com.vishal.domain.USER_ROLE;
import com.vishal.model.User;
import com.vishal.repository.UserRepository;
import com.vishal.service.WatchlistService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
public class AppConfig {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private WatchlistService watchlistService;

	// Where to send the browser back to after a successful Google login,
	// with the freshly issued JWT attached as a query param.
	@Value("${app.frontend.url:http://localhost:5173}")
	private String frontendUrl;

	 @Bean
	    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

	        http.sessionManagement(management -> management.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
	                .authorizeHttpRequests(Authorize -> Authorize
	                		// BUGFIX: this was commented out, meaning ANY authenticated user
	                		// (not just admins) could call withdrawal-approval and other
	                		// /api/admin/** endpoints. The more specific matcher must be
	                		// declared before the general "/api/**" rule.
	                		.requestMatchers("/api/admin/**").hasRole("ADMIN")
	                                .requestMatchers("/api/**").authenticated()
	                                
	                                .anyRequest().permitAll()
	                )
					.oauth2Login(oauth->{
						oauth.loginPage("/login/google");
						oauth.authorizationEndpoint(authorization->
								authorization.baseUri("/login/oauth2/authorization"));
						oauth.successHandler(new AuthenticationSuccessHandler() {

							@Override
							public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
																Authentication authentication) throws IOException, ServletException {

								if(authentication.getPrincipal() instanceof DefaultOAuth2User) {
									DefaultOAuth2User userDetails = (DefaultOAuth2User) authentication.getPrincipal();
									String email = userDetails.getAttribute("email");
									String fullName=userDetails.getAttribute("name");
									String phone=userDetails.getAttribute("phone");
									String picture=userDetails.getAttribute("picture");
									boolean email_verified= Boolean.TRUE.equals(userDetails.getAttribute("email_verified"));

									// BUGFIX: previously a transient User object was built and
									// then only printed to the console - it was never saved,
									// and no JWT was ever issued, so Google login silently did
									// nothing useful from the client's point of view.
									User user = userRepository.findByEmail(email);
									boolean isNewUser = (user == null);

									if (isNewUser) {
										user = new User();
										user.setEmail(email);
										user.setFullName(fullName);
										user.setMobile(phone);
										user.setRole(USER_ROLE.ROLE_USER);
									}

									user.setVerified(email_verified);
									if (fullName != null) user.setFullName(fullName);
									if (picture != null) user.setPicture(picture);

									User savedUser = userRepository.save(user);

									if (isNewUser) {
										watchlistService.createWatchList(savedUser);
									}

									Authentication jwtAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
											savedUser.getEmail(), null,
											List.of(new SimpleGrantedAuthority(savedUser.getRole().toString())));

									String jwt = JwtProvider.generateToken(jwtAuth);

									response.sendRedirect(frontendUrl + "/oauth/success?token=" + jwt);
								} else {
									response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
								}

							}
						});
					})
	                .addFilterBefore(new JwtTokenValidator(), BasicAuthenticationFilter.class)
	                .csrf(csrf -> csrf.disable())
	                .cors(cors -> cors.configurationSource(corsConfigurationSource()));
	               
			
			return http.build();
			
		}
		
	    // CORS Configuration
	    private CorsConfigurationSource corsConfigurationSource() {
	        return new CorsConfigurationSource() {
	            @Override
	            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
	                CorsConfiguration cfg = new CorsConfiguration();
	                cfg.setAllowedOrigins(Arrays.asList(
	                    "http://localhost:3000",
	                    "http://localhost:5173",
						"http://localhost:5174",
	                    "http://localhost:4200"
						// Add your deployed frontend URL here, e.g. "https://your-frontend.vercel.app"
	                ));
	                cfg.setAllowedMethods(Collections.singletonList("*"));
	                cfg.setAllowCredentials(true);
	                cfg.setAllowedHeaders(Collections.singletonList("*"));
	                cfg.setExposedHeaders(Arrays.asList("Authorization"));
	                cfg.setMaxAge(3600L);
	                return cfg;
	            }
	        };
	    }

	    @Bean
	    PasswordEncoder passwordEncoder() {
			return new BCryptPasswordEncoder();
		}


}
