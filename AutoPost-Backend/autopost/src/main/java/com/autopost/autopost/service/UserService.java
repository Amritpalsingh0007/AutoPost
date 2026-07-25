package com.autopost.autopost.service;

import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.repository.UserAuthRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements UserDetailsService {

    private final UserAuthRepository userAuthRepository;

    public UserService(UserAuthRepository userAuthRepository) {
        this.userAuthRepository = userAuthRepository;
    }

    /**
     * Spring Security calls this with whatever string was used as the "username".
     * For this app the login identifier is email — so we look up by email.
     * The returned UserDetails.getUsername() will also be the email string,
     * which is what gets embedded in the JWT subject.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserAuth userAuth = userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No account for: " + email));

        return new User(
                userAuth.getEmail(),
                userAuth.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
