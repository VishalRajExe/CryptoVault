package com.vishal.service;

import com.vishal.model.User;
import com.vishal.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;



@Service
public class CustomeUserServiceImplementation implements UserDetailsService {


private UserRepository userRepository;
	
	public CustomeUserServiceImplementation(UserRepository userRepository) {
		this.userRepository=userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		User user = userRepository.findByEmail(username);
		
		if(user==null) {

			throw new UsernameNotFoundException("user not found with email  - "+username);
		}

		// Safety net for AdminConfig.ADMIN_EMAIL: if this account already existed
		// before that email was designated admin (so signup never had a chance to
		// set the role), promote it here, on every login, instead of requiring a
		// manual database edit. Idempotent - only writes when the role actually
		// needs to change.
		if (com.vishal.config.AdminConfig.ADMIN_EMAIL.equalsIgnoreCase(user.getEmail())
				&& user.getRole() != com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
			user.setRole(com.vishal.domain.USER_ROLE.ROLE_ADMIN);
			user = userRepository.save(user);
		}

		// BUGFIX: previously this list was always empty, so every authenticated
		// user's JWT was issued WITHOUT their role (ROLE_USER / ROLE_ADMIN).
		// That silently broke all role-based authorization in the app.
		List<GrantedAuthority> authorities=new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority(user.getRole().toString()));

		return new org.springframework.security.core.userdetails.User(
				user.getEmail(),user.getPassword(),authorities);
	}


}
