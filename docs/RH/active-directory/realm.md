---
sidebar_label: 'RealmD'
sidebar_position: 2
---

# Why I don't use RealmD

RealmD can sometimes be utilized as a shortcut for joining a system to AD. Unfortunately, it skips a few quality of life options and some required options. I've come across a lot of people that have joined their systems to AD and ended up with the machines falling off the domain, dealing with slow logins, or complaining there's no way to manage who can log in. Using the method described [here](join-ad.md), I've had machine stay on the domain for years with no problems, all of the logins were fast, and I could easily manage who could log in and I even could have added SSH keys if I wanted.

## Overview 
| Symptom                    | Options                             |
|----------------------------|-------------------------------------|
| Intermittent access denied | `ad_enabled_gc = false`             |
| Slow logins                | `ignore_group_members = true`       |
| Overlapping UID/GID        | `ldap_idmap_range_size = 4000000`   |
| Home directory with '@'    | `override_homedir = /home/%u`       |
| Anyone can login           | `simple_allow_groups`               |
| Domain must be specified   | `use_fully_qualified_names = false` |

## The missing configs and how to work around them

1. `ad_enable_gc = false`  
    This configuration option tells SSSD to ignore global catalogs. This is because when SSSD makes a request to AD, it has the option to look at the global catalog first, which has the potential to speed up or slow down a request. If there are missing fields, a second request should be made to the domain's DCs to retreive the remaining fields. However, in my experience, SSSD doesn't make that second request. This resulted in users getting intermittently denied access. This is because sometimes SSSD would make a request to a DC on the domain and get the list of groups the user was a member of and sometimes it would make a request to a DC on the parent domain, which didn't have the list of groups the user was a member of resulting in SSSD thinking the user wasn't a member of any groups.  
    To work around this missing option, it can be added to the SSSD configuration inside of the `[domain/<domain>]` section.

1. `ignore_group_members = true`
    This configuration option is counter intuitive. At first glance, it sounds like it is saying to ignore the groups the user is a member of, but actually, it is saying don't get all of the users in the groups. When user A logs in, you don't need to know that users B, C, and D are all members of the same groups as user A. You just need to know what groups user A are in. Not setting this option is typically one of the major reasons for a slow login.  
    To work around this missing option, it can be added to the SSSD configuration inside of the `[domain/<domain>]` section.

1. `ldap_idmap_range_size = 4000000`
    This configuration option increases the range that SSSD can use. It is required for large environments, but it doesn't hurt anything for small environments. When a new user logs in, SSSD will hash the Security Identifiers (SIDs) of the user and groups to generate the UID and GIDs. As long as the range is large enough, it's unlikely to get a duplicate. If a duplicate is found, the next available id is used.  
    To work around this missing option, it can be added to the SSSD configuration inside of the `[domain/<domain>]` section.

1. `override_homedir = /home/%u` or `fallback_homedir = /home/%u`
    Realm will configure the `fallback_homedir` to `/home/%u@%d`. This will result in a '@' in your home directory and a long home directory name. If you need to be able to identify domain home directories from local home directories, you can set the value to `/home/%d/%u`. It will be a longer path, but it won't include special characters.
    To work around this missing option, it can be added to the SSSD configuration inside of the `[domain/<domain>]` section.

1. `simple_allow_groups`
    This is something that can be configured through `realm` but I still felt it deserved to be mentioned since it isn't enabled by default. When `realm` joins a machine to the domain, any user in that domain can log in to the system. This includes your janitor if they have an AD account. Even if that AD account was just so they could look at their paychecks. When you run `realm --help` it only shows that you can permit users to log in. However, if you run `realm permit --help` it will show you more options including how to allow groups to log in. Regardless of which method you use to join your server to the domain, make sure to restrict who can log in.

1. `use_fully_qualified_names = false`
    This is not an option I normally explicitly set in my configurations, but it is the default value. However, when `realm` join a system, it will set the option to `True`. When it is true, it will require you to always specify the domain when referencing a domain account. This can cause issues when software is not expecting an '@' in the middle of your username.
    To work around this option, it can be removed or modified in the SSSD configuration inside of the `[domain/<domain>]` section.