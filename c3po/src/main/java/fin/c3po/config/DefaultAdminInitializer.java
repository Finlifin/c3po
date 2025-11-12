package fin.c3po.config;

import fin.c3po.user.UserAccount;
import fin.c3po.user.UserAccountRepository;
import fin.c3po.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DefaultAdminInitializer {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner ensureDefaultAdmin() {
        return args -> {
            userAccountRepository.findByUsernameIgnoreCase("admin")
                    .ifPresentOrElse(
                            user -> log.debug("Default admin user already present"),
                            () -> {
                                UserAccount admin = new UserAccount(
                                        "admin",
                                        "admin@c3po.local",
                                        passwordEncoder.encode("admin123"),
                                        UserRole.ADMIN
                                );
                                userAccountRepository.save(admin);
                                log.info("Default admin user created with username=admin password=admin123");
                            }
                    );
        };
    }
}


